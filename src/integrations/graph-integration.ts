import type { AstroIntegration } from 'astro';
import { getCollection } from 'astro:content';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { SUPPORTED_LOCALES, parseLeafBundleId } from '../utils/slugs.js';

export default function graphIntegration(): AstroIntegration {
  return {
    name: 'graph-integration',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        logger.info('Starting graph data generation...');
        
        // C3: Сбор nodes из коллекций
        const collections = await Promise.all([
          getCollection('blog'),
          getCollection('cases'),
          getCollection('services'),
          getCollection('industries'),
          // legal НЕ включаем — системные страницы
        ]);

        const nodes = collections.flat().map(entry => {
          const { slug, lang } = parseLeafBundleId(entry.id);
          return {
            id: `${entry.collection}/${slug}`,
            title: entry.data.title,
            type: entry.collection,
            lang,
            slug,
            tags: entry.data.tags || [],
          };
        });

        logger.info(`Collected ${nodes.length} nodes`);

        // C4: Сбор edges (explicit + outbound)
        const edges = [];
        
        for (const entry of collections.flat()) {
          const { slug, lang } = parseLeafBundleId(entry.id);
          const id = `${entry.collection}/${slug}`;
          
          // Explicit links (frontmatter — relatedCases, relatedServices, etc.)
          const explicitEdges = [
            ...(entry.data.relatedCases || []).map(to => ({ 
              from: id, 
              to: `cases/${to}`, 
              source: 'explicit' 
            })),
            ...(entry.data.relatedServices || []).map(to => ({ 
              from: id, 
              to: `services/${to}`, 
              source: 'explicit' 
            })),
            ...(entry.data.relatedIndustries || []).map(to => ({ 
              from: id, 
              to: `industries/${to}`, 
              source: 'explicit' 
            })),
          ];
          
          // Outbound links (из remark plugin — ссылки в тексте)
          // Используем outboundLinks (терминология из ТЗ!)
          const outboundEdges = ((entry.data as any).outboundLinks || []).map((to: string) => ({
            from: id,
            to,
            source: 'outbound',
          }));
          
          edges.push(...explicitEdges, ...outboundEdges);
        }

        logger.info(`Collected ${edges.length} edges`);

        // C5: Валидация ссылок
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
          // Не fail, только warning
        }

        // C6: Генерация мультиязычных JSON + Pagefind
        const publicDir = path.join(dir.pathname, '..', 'public');
        await fs.mkdir(publicDir, { recursive: true });

        for (const lang of SUPPORTED_LOCALES) {
          const langNodes = nodes.filter(n => n.lang === lang);
          const langNodeIds = new Set(langNodes.map(n => n.id));
          
          const langEdges = edges.filter(e => 
            langNodeIds.has(e.from) && langNodeIds.has(e.to)
          );
          
          const graphData = { nodes: langNodes, edges: langEdges };
          
          await fs.writeFile(
            path.join(publicDir, `graph-data-${lang}.json`),
            JSON.stringify(graphData, null, 2)
          );
          
          logger.info(`✓ graph-data-${lang}.json: ${langNodes.length} nodes, ${langEdges.length} edges`);
        }
        
        // Pagefind с lang-фильтрами
        logger.info('Running Pagefind...');
        await new Promise<void>((resolve, reject) => {
          const pagefind = spawn('npx', ['-y', 'pagefind', 
            '--site', dir.pathname,
            '--glob', '{ru,en,de,tr,zh-CN,es,fr,pt,it,ar}/**/*.html'
          ], {
            stdio: 'inherit', 
            shell: true,
          });
          
          pagefind.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`Pagefind exited with code ${code}`));
            }
          });
        });
        
        logger.info('✓ Graph integration completed');
      },
    },
  };
}
