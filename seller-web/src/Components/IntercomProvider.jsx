import { IntercomProvider } from 'react-use-intercom';
import PropTypes from 'prop-types';

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

IntercomWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export default IntercomWrapper; 