import KeeneticClient from 'router-client/providers/KeeneticClient';

import RouterClient from 'router-client/utilities/RouterClient';

const routerClient = new RouterClient({
  provider: new KeeneticClient(),
});

export default routerClient;
