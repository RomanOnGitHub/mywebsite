import type { AstroIntegration } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
// Используем относительный импорт (Node.js окружение, не Astro)
import { SUPPORTED_LOCALES, parseLeafBundleId } from '../utils/slugs';
import matter from 'gray-matter';
import { glob } from 'glob';
import type { GraphNode, GraphEdge, GraphData } from '../types/graph';

export default function graphIntegration(): AstroIntegration {
  return {
    name: 'graph-integration',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        logger.info('Starting graph data generation...');
        
        try {
          const contentDir = path.join(process.cwd(), 'src', 'content');
          const collections = ['blog', 'cases', 'services', 'industries'] as const;
          
          const nodes: GraphNode[] = [];
          const edges: GraphEdge[] = [];
          
          // Читаем файлы напрямую из файловой системы
          for (const collection of collections) {
            const collectionPath = path.join(contentDir, collection);
            const files = await glob(`${collectionPath}/**/*.{md,mdx}`);
            
            for (const filePath of files) {
              const content = await fs.readFile(filePath, 'utf-8');
              const { data } = matter(content);
              
              // Извлекаем slug и lang из пути (Leaf Bundle: slug/lang.mdx)
              const relativePath = path.relative(collectionPath, filePath);
              const dirParts = path.dirname(relativePath).split(path.sep).filter(p => p !== '.');
              const filename = path.basename(relativePath, path.extname(relativePath));
              
              // Для Leaf Bundle: путь вида "test-post/ru.mdx" → slug="test-post", lang="ru"
              const slug = dirParts.length > 0 ? dirParts.join('/') : filename;
              const lang = dirParts.length > 0 ? filename : 'ru'; // Если нет папки, используем default
              
              const nodeId = `${collection}/${slug}`;
              
              nodes.push({
                id: nodeId,
                title: data.title || '',
                type: collection as GraphNode['type'],
                lang,
                slug,
                tags: (data.tags || []) as string[],
              });
              
              // Explicit edges
              if (data.relatedCases) {
                data.relatedCases.forEach((to: string) => {
                  edges.push({ from: nodeId, to: `cases/${to}`, source: 'explicit' });
                });
              }
              if (data.relatedServices) {
                data.relatedServices.forEach((to: string) => {
                  edges.push({ from: nodeId, to: `services/${to}`, source: 'explicit' });
                });
              }
              if (data.relatedIndustries) {
                data.relatedIndustries.forEach((to: string) => {
                  edges.push({ from: nodeId, to: `industries/${to}`, source: 'explicit' });
                });
              }
              
              // Outbound links (из remark plugin - если есть в data)
              if (data.outboundLinks) {
                data.outboundLinks.forEach((to: string) => {
                  edges.push({ from: nodeId, to, source: 'outbound' });
                });
              }
            }
          }
          
          logger.info(`Collected ${nodes.length} nodes, ${edges.length} edges`);
          
          // Валидация
          const validIds = new Set(nodes.map(n => n.id));
          const brokenExplicit = edges.filter(e => e.source === 'explicit' && !validIds.has(e.to));
          const brokenOutbound = edges.filter(e => e.source === 'outbound' && !validIds.has(e.to));
          
          if (brokenExplicit.length > 0) {
            logger.error('❌ Broken explicit links:');
            brokenExplicit.forEach(({ from, to }) => logger.error(`  ${from} → ${to}`));
            throw new Error(`Found ${brokenExplicit.length} broken explicit link(s)`);
          }
          
          if (brokenOutbound.length > 0) {
            logger.warn('⚠️ Broken outbound links:');
            brokenOutbound.forEach(({ from, to }) => logger.warn(`  ${from} → ${to}`));
          }
          
          // Генерация JSON файлов
          // Используем process.cwd()/public для надёжности (не зависим от формата dir.pathname)
          const publicDir = path.join(process.cwd(), 'public');
          await fs.mkdir(publicDir, { recursive: true });
          
          for (const lang of SUPPORTED_LOCALES) {
            const langNodes = nodes.filter(n => n.lang === lang);
            const langNodeIds = new Set(langNodes.map(n => n.id));
            const langEdges = edges.filter(e => 
              langNodeIds.has(e.from) && langNodeIds.has(e.to)
            );
            
            const graphData: GraphData = { nodes: langNodes, edges: langEdges };
            
            await fs.writeFile(
              path.join(publicDir, `graph-data-${lang}.json`),
              JSON.stringify(graphData, null, 2)
            );
            
            logger.info(`✓ graph-data-${lang}.json: ${langNodes.length} nodes, ${langEdges.length} edges`);
          }
          
          // Pagefind
          // Оборачиваем в try/catch для graceful degradation если pagefind недоступен
          try {
            logger.info('Running Pagefind...');
            await new Promise<void>((resolve) => {
              const pagefind = spawn('npx', ['-y', 'pagefind', 
                '--site', dir.pathname,
                '--glob', '{ru,en,de,tr,zh-cn,es,fr,pt,it,ar}/**/*.html'
              ], {
                stdio: 'inherit', 
                shell: true,
              });
              
              pagefind.on('close', (code) => {
                if (code === 0) {
                  resolve();
                } else {
                  logger.warn(`Pagefind exited with code ${code}, continuing...`);
                  resolve(); // Не fail, только warning
                }
              });
              
              pagefind.on('error', (err) => {
                logger.warn('Pagefind spawn error, skipping indexing step:', err);
                resolve(); // Не fail, продолжаем сборку
              });
            });
          } catch (err) {
            logger.warn('Pagefind failed or not available, skipping indexing step.', err);
            // Не выбрасываем ошибку - сборка продолжается без индексации
          }
          
          logger.info('✓ Graph integration completed');
        } catch (error) {
          logger.error('Error in graph integration:', error);
          throw error;
        }
      },
    },
  };
}
