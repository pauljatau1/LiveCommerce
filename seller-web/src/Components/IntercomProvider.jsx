import { IntercomProvider } from 'react-use-intercom';

const IntercomWrapper = ({ children }) => {
  return (
    <IntercomProvider 
      appId="s2xos2me"
      autoBoot={false}
      shouldInitialize={true}
      onUnreadCountChange={() => {
        console.log('unread count changed');
      }}
    >
      {children}
    </IntercomProvider>
  );
};

export default IntercomWrapper; 