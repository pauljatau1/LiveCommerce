import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';

const AlertNotification = ({
  message = 'Your account is in danger of being suspended, please complete your identity verification within 72hrs.',
  color = "#DF0707",
  background = "#DF07070A",
  notificationIcon = "formkit:warning"
}) => {
  return (
    <div 
      className="flex items-center gap-2 rounded-full px-3 py-3 lg:py-4 lg:px-3 xl:pl-9 w-full"
      style={{ backgroundColor: background }}
    >
      <Icon icon={notificationIcon} className="w-6 h-6" color={color} />
      <p style={{ color: color }} className="text-sm xl:text-base font-cabin font-normal">
        {message}
      </p>
    </div>
  )
};

AlertNotification.propTypes = {
  message: PropTypes.string,
  color: PropTypes.string,
  background: PropTypes.string,
  notificationIcon: PropTypes.string
}

export default AlertNotification;
