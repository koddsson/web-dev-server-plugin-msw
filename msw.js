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

/**
 * Set up mocking routes
 *
 * @param {(rest, response, worker) => unknown[]} mocks Callback that returns the MSW mocks.
 * @param {unknown[]} defaultRoutes The default routes
 */
function setRoutes(mocks, defaultRoutesCallback) {
  // Set up basic routes for convenience if they exists
  const defaultRoutes = defaultRoutesCallback?.({rest, HttpResponse, worker}) || [];
  if (!mocks) {
  worker.use(...defaultRoutes);
  } else {
    const routes = mocks({
      rest,
      HttpResponse,
      worker,
    });
    if (routes) {
      worker.resetHandlers(...routes, ...defaultRoutes);
    }
  }
}

export {worker, rest, HttpResponse, setRoutes}
