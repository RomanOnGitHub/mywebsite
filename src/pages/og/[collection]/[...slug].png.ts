import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { parseLeafBundleId, DEFAULT_LOCALE } from '@/utils/slugs';
import satori from 'satori';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

    // Загружаем шрифт (обязательно для satori!)
    // satori требует TTF/OTF, не WOFF2
    let fontData: ArrayBuffer | null = null;

async function loadFont() {
  if (fontData) return fontData;
  
  try {
    // Пытаемся загрузить шрифт из public или node_modules
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf');
    fontData = await fs.readFile(fontPath).then(buf => buf.buffer);
  } catch {
    // Fallback: используем встроенный шрифт или пропускаем
    // В production нужно добавить TTF шрифт в public/fonts/
    console.warn('Font file not found, using fallback SVG without custom font');
  }
  
  return fontData;
}

import type { APIRoute } from 'astro';

export async function GET({ params, url }: APIRoute) {
  const { collection, slug } = params;
  
  // Валидация коллекции
  const validCollections = ['blog', 'cases', 'services', 'industries'];
  if (!validCollections.includes(collection)) {
    return new Response('Invalid collection', { status: 400 });
  }
  
  try {
    // Получаем запись из коллекции
    const entries = await getCollection(collection as 'blog' | 'cases' | 'services' | 'industries');
    const slugParts = Array.isArray(slug) ? slug.join('/') : slug;
    
    // Находим запись по slug (используем default locale)
    const entry = entries.find(e => {
      const { slug: entrySlug } = parseLeafBundleId(e.id);
      return entrySlug === slugParts;
    });
    
    if (!entry) {
      return new Response('Entry not found', { status: 404 });
    }
    
    // Генерируем OG изображение
    const title = entry.data.title;
    const description = entry.data.description || '';
    
    // Загружаем шрифт
    const font = await loadFont();
    
    if (!font) {
      // Fallback: простое SVG изображение без satori
      const svg = `
        <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
          <rect width="1200" height="630" fill="#1e40af"/>
          <text x="600" y="280" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(title)}</text>
          ${description ? `<text x="600" y="380" font-family="Arial, sans-serif" font-size="32" fill="#e0e7ff" text-anchor="middle">${escapeXml(description.length > 100 ? description.substring(0, 100) + '...' : description)}</text>` : ''}
        </svg>
      `;
      
      const png = await sharp(Buffer.from(svg))
        .png()
        .toBuffer();
      
      return new Response(png, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
    
    // Генерируем SVG с satori (только если есть шрифт)
    const svg = await satori(
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#1e40af',
            padding: '80px',
            fontFamily: 'Inter',
          },
          children: [
            {
              type: 'div',
              props: {
                style: {
                  fontSize: '64px',
                  fontWeight: 'bold',
                  color: 'white',
                  textAlign: 'center',
                  marginBottom: '40px',
                  lineHeight: 1.2,
                },
                children: title,
              },
            },
            description && {
              type: 'div',
              props: {
                style: {
                  fontSize: '32px',
                  color: '#e0e7ff',
                  textAlign: 'center',
                  lineHeight: 1.4,
                },
                children: description.length > 100 ? description.substring(0, 100) + '...' : description,
              },
            },
          ].filter(Boolean),
        },
      },
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: font,
            style: 'normal',
            weight: 400,
          },
        ],
      }
    );
    
    // Конвертируем SVG в PNG
    const png = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
    
    return new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error generating OG image:', error);
    
    // Fallback: дефолтное изображение
    const fallbackSvg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#1e40af"/>
        <text x="600" y="315" font-family="Arial" font-size="48" fill="white" text-anchor="middle">${collection}</text>
      </svg>
    `;
    
    const png = await sharp(Buffer.from(fallbackSvg))
      .png()
      .toBuffer();
    
    return new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}

export async function getStaticPaths() {
  const collections = ['blog', 'cases', 'services', 'industries'];
  const paths = [];
  
  for (const collection of collections) {
    try {
      const entries = await getCollection(collection as 'blog' | 'cases' | 'services' | 'industries');
      
      for (const entry of entries) {
        const { slug } = parseLeafBundleId(entry.id);
      paths.push({
        params: {
          collection,
          slug: slug, // Для [...slug] передаём строку, Astro сам разобьёт
        },
      });
      }
    } catch (error) {
      console.error(`Error generating paths for ${collection}:`, error);
    }
  }
  
  return paths;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
