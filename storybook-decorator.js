import { makeDecorator } from '@web/storybook-prebuilt/addons';
import { rest, HttpResponse, worker} from './msw.js';

export function withMocks(mocks) {
  // Set up basic routes for convenience if they exists
  const defaultRoutes = mocks?.default?.({ rest, HttpResponse }) || [];
  if (defaultRoutes) {
    worker.use(...defaultRoutes);
  }
  return makeDecorator({
    name: 'withMocks',
    parameterName: 'mocks',
    wrapper: (getStory, context) => {
      if (context.parameters.mocks) {
        const routes = context.parameters.mocks({
          rest,
          HttpResponse,
          worker,
        });
        if (routes) {
          worker.resetHandlers(...routes, ...defaultRoutes);
        }
      } else {
        worker.resetHandlers(...defaultRoutes);
      }

      return getStory(context);
    },
  });
}
