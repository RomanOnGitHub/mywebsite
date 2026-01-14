import type { AstroIntegration } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
// ⚠️ ИСКЛЮЧЕНИЕ: В build-time интеграциях (astro:build:done hook) алиас @/ не резолвится
// Vite резолвит алиасы только для клиентского кода и компонентов, но не для Node.js контекста интеграций
// Используем относительные пути как исключение из общего правила
import { SUPPORTED_LOCALES, parseLeafBundleId } from '../utils/slugs.js';
import matter from 'gray-matter';
import { glob } from 'glob';
import type { GraphNode, GraphEdge, GraphData } from '../types/graph.js';

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
          
          // ⚡️ PERF: Параллельная обработка коллекций для ускорения build-time
          // Обрабатываем все коллекции одновременно вместо последовательно
          const collectionPromises = collections.map(async (collection) => {
            const collectionPath = path.join(contentDir, collection);
            const files = await glob(`${collectionPath}/**/*.{md,mdx}`);
            
            // ⚡️ PERF: Параллельное чтение файлов внутри коллекции
            const filePromises = files.map(async (filePath) => {
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
              
              const node: GraphNode = {
                id: nodeId,
                title: data.title || '',
                type: collection as GraphNode['type'],
                lang,
                slug,
                tags: (data.tags || []) as string[],
              };
              
              const nodeEdges: GraphEdge[] = [];
              
              // Explicit edges
              if (data.relatedCases) {
                data.relatedCases.forEach((to: string) => {
                  nodeEdges.push({ from: nodeId, to: `cases/${to}`, source: 'explicit' });
                });
              }
              if (data.relatedServices) {
                data.relatedServices.forEach((to: string) => {
                  nodeEdges.push({ from: nodeId, to: `services/${to}`, source: 'explicit' });
                });
              }
              if (data.relatedIndustries) {
                data.relatedIndustries.forEach((to: string) => {
                  nodeEdges.push({ from: nodeId, to: `industries/${to}`, source: 'explicit' });
                });
              }
              
              // Outbound links (из remark plugin - если есть в data)
              if (data.outboundLinks) {
                data.outboundLinks.forEach((to: string) => {
                  nodeEdges.push({ from: nodeId, to, source: 'outbound' });
                });
              }
              
              return { node, edges: nodeEdges };
            });
            
            const results = await Promise.all(filePromises);
            return results;
          });
          
          const allResults = await Promise.all(collectionPromises);
          
          // Собираем все узлы и рёбра из всех коллекций
          for (const collectionResults of allResults) {
            for (const { node, edges: nodeEdges } of collectionResults) {
              nodes.push(node);
              edges.push(...nodeEdges);
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
            
            // ⚡️ PERF: Минифицированный JSON без форматирования для уменьшения размера
            // Размер файла уменьшается на ~30-40% без форматирования
            await fs.writeFile(
              path.join(publicDir, `graph-data-${lang}.json`),
              JSON.stringify(graphData)
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
