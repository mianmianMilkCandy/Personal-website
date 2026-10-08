/**
 * 把 public/ 下的资源路径拼成对部署位置无关的地址。
 * vite.config 里 base 为 './'，因此 BASE_URL 为 './'，产物可放任意子目录。
 */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
