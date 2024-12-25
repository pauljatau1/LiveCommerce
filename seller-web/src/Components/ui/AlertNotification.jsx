import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';



const AlertNotification = ({message = 'Your account is in danger of being suspended, please complete your identity verification within 72hrs.', color = "#DF0707", background = "#DF07070A" }) => {
  return (
    <div className={`flex items-center gap-2 bg-[#DF07070A] rounded-full px-3 py-3 lg:py-4 lg:px-3 xl:pl-9 w-full `}>
      <Icon icon="formkit:warning" className="w-6 h-6 xl:w-8 xl:h-8" color= {color} />
      <p className={`text-[${color}] text-sm xl:text-base font-cabin font-normal`}>{message}</p>
    </div>
  )
};

AlertNotification.propTypes = {
  message: PropTypes.string,
  color: PropTypes.string,
  background: PropTypes.string
}

export default AlertNotification
