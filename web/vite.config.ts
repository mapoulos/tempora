import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  resolve: {
    alias: [
      {
        find: /^@material-ui\/icons\/(.*)/,
        replacement: "@material-ui/icons/esm/$1",
      },
      {
        find: /^@material-ui\/core\/(.+)/,
        replacement: "@material-ui/core/es/$1",
      },
      {
        find: /^@material-ui\/core$/,
        replacement: "@material-ui/core/es",
      },
    ],
  },
})
