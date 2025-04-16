import { useLayoutEffect, useEffect } from 'react';
import { selectAppSettings } from '@/redux/settings/selectors';
import { useDispatch, useSelector } from 'react-redux';
import { Layout } from 'antd';
import { useAppContext } from '@/context/appContext';
import Navigation from '@/apps/Navigation/NavigationContainer';
import HeaderContent from '@/apps/Header/HeaderContainer';
import PageLoader from '@/components/PageLoader';
import { settingsAction } from '@/redux/settings/actions';
import { selectSettings } from '@/redux/settings/selectors';
import AppRouter from '@/router/AppRouter';
import useResponsive from '@/hooks/useResponsive';
import storePersist from '@/redux/storePersist';

export default function ErpCrmApp() {
  const { Content } = Layout;
  const { isMobile } = useResponsive();
  const dispatch = useDispatch();
  const { isSuccess: settingIsloaded, isLoading, result: settings } = useSelector(selectSettings);

  useLayoutEffect(() => {
    console.log('Loading settings...');
    dispatch(settingsAction.list({ entity: 'setting' }));
  }, [dispatch]);

  useEffect(() => {
    if (isLoading) {
      console.log('Settings are loading...');
    }
    if (settingIsloaded) {
      console.log('Settings loaded successfully:', settings);
    }
  }, [isLoading, settingIsloaded, settings]);

  // If settings are still loading after 10 seconds, show the app anyway
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!settingIsloaded && isLoading) {
        console.log('Settings loading timeout - proceeding with app render');
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [settingIsloaded, isLoading]);

  // Show the app if settings are loaded or if we've been loading for too long
  if (settingIsloaded || (!isLoading && !settingIsloaded)) {
    return (
      <Layout hasSider>
        <Navigation />
        {isMobile ? (
          <Layout style={{ marginLeft: 0 }}>
            <HeaderContent />
            <Content
              style={{
                margin: '40px auto 30px',
                overflow: 'initial',
                width: '100%',
                padding: '0 25px',
                maxWidth: 'none',
              }}
            >
              <AppRouter />
            </Content>
          </Layout>
        ) : (
          <Layout>
            <HeaderContent />
            <Content
              style={{
                margin: '40px auto 30px',
                overflow: 'initial',
                width: '100%',
                padding: '0 50px',
                maxWidth: 1400,
              }}
            >
              <AppRouter />
            </Content>
          </Layout>
        )}
      </Layout>
    );
  }

  return <PageLoader />;
}
