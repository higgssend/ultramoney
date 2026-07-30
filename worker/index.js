export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = new URL(request.url);
    targetUrl.hostname = "sxwv82iw.us-east.insforge.app";
    
    let newPath = url.pathname;
    if (newPath.startsWith('/v1')) {
       // Permite /v1 o /v1/ y lo convierte en la ruta interna
       newPath = newPath.replace(/^\/v1\/?/, '/functions/v1/api');
    } else if (newPath === '/') {
       newPath = '/functions/v1/api';
    } else {
       newPath = '/functions/v1/api' + newPath;
    }
    
    targetUrl.pathname = newPath;
    targetUrl.search = url.search;

    const newRequest = new Request(targetUrl.toString(), request);
    return fetch(newRequest);
  }
};
