import path from 'path';
import process from 'node:process';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const isDocker = env.DOCKER_ENV === 'true' || process.env.DOCKER_ENV === 'true';
  /** 127.0.0.1 tránh Windows ưu tiên IPv6 (::1) khiến proxy tới localhost:5000 trượt. */
  const localGatewayTarget =
    env.VITE_DEV_PROXY_TARGET?.trim() ||
    process.env.VITE_DEV_PROXY_TARGET?.trim() ||
    'http://127.0.0.1:5000';

  const proxyCommon = {
    target: isDocker ? 'http://backend:5000' : localGatewayTarget,
    changeOrigin: true,
    secure: false,
  };

  return {
    test: {
      environment: 'node',
      include: ['src/**/*.test.{js,jsx}'],
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }

            if (
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('react') ||
              id.includes('scheduler') ||
              id.includes('react-quill') ||
              id.includes('quill') ||
              id.includes('recharts')
            ) {
              return 'framework';
            }

            if (id.includes('@radix-ui')) {
              return 'radix';
            }

            if (id.includes('socket.io-client')) {
              return 'realtime';
            }

            if (id.includes('framer-motion')) {
              return 'motion';
            }

            if (id.includes('lucide-react')) {
              return 'lucide';
            }

            if (id.includes('axios')) {
              return 'http';
            }

            return undefined;
          },
        },
      },
    },
    server: {
      port: 3000,
      host: true, // Bắt buộc để Docker expose port ra ngoài
      /** Chỉ polling trong Docker (bind mount) — dev native dùng fs events, giảm CPU/độ trễ. */
      watch: isDocker ? { usePolling: true } : { usePolling: false },
      proxy: {
        '/api/auth': proxyCommon,
        '/api': proxyCommon,
        '/socket.io': { ...proxyCommon, ws: true },
        '/uploads': proxyCommon,
      },
    },
    // `vite preview` không kế thừa server.proxy — cần cấu hình riêng để /api (OAuth, REST) không 404.
    preview: {
      port: 4173,
      host: true,
      proxy: {
        '/api/auth': proxyCommon,
        '/api': proxyCommon,
        '/socket.io': { ...proxyCommon, ws: true },
        '/uploads': proxyCommon,
      },
    },
  };
});
