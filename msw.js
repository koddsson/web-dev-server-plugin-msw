import { rest, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';

const worker = setupWorker()
worker.start({
  serviceWorker: {
    url: '__msw_sw__.js',
  },
  quiet: true,
  // See https://github.com/mswjs/msw/discussions/1231#discussioncomment-2729999 if you'd like to warn if there's a unhandled request
  onUnhandledRequest() {
    return undefined;
  },
});

export {worker, rest, HttpResponse}
