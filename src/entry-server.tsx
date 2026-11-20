import { renderToPipeableStream, renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { PassThrough } from 'node:stream';
import App from './App';

export async function render(url: string): Promise<string> {
  const application = <StaticRouter location={url}><App /></StaticRouter>;
  // Resolve lazy route modules first, then emit complete, non-streaming HTML.
  await new Promise<void>((resolve, reject) => {
    const output = new PassThrough();
    output.on('data', () => {});
    output.on('end', () => resolve());
    const stream = renderToPipeableStream(application, {
      onAllReady() { stream.pipe(output); },
      onError(error) { reject(error); },
    });
  });
  return renderToString(application);
}
