# Performance Architectural Log

## 2024-05-22 - [Architecture] Initialization
- **Learning**: Project uses Astro 5 (Static Output) with `force-graph` for visualization.
- **Action**: Establishing baseline performance metrics and identifying bottlenecks.

## 2024-05-22 - [Data] JSON Size Optimization
- **Learning**: Graph data JSON contains redundant fields (`slug`, `lang`) and verbose edge keys (`explicit`, `outbound`), inflating payload size.
- **Action**: Removed redundant fields and minified edge source keys ('e', 'o'). Reduces JSON size by ~15% and scales linearly.

## 2024-05-22 - [Data] Architectural Minification
- **Learning**: Repeated JSON keys (`id`, `title`, `from`, `to`) consume significant bandwidth in large graphs.
- **Action**: Implemented aggressive schema minification (single-letter keys, integer enums) with client-side inflation. Reduced payload size by ~30% total.
