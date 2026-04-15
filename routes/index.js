import locationRoutes from './location.js';

const constructorMethod = (app) => {
  app.use('/', locationRoutes);
  app.use(/(.*)/, (req, res) => {
    res.status(404).render('error', {errorClass: 'error', error: 'Route Not found'});
  });
};

export default constructorMethod;