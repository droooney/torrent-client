import '../../styles/reset.scss';
import '../../styles/globals.scss';

import { FC } from 'react';
import { Route, Routes } from 'react-router-dom';

import urls from 'web-client/constants/urls';

import Home from 'web-client/pages/Home/Home';

import styles from './App.module.scss';

const App: FC = () => {
  return (
    <div className={styles.app}>
      <Routes>
        <Route path={urls.home} element={<Home />} />
      </Routes>
    </div>
  );
};

export default App;
