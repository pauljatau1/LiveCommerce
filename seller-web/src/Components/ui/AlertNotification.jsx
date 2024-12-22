import { Icon } from '@iconify/react';



const AlertNotification = () => {
  return (
    <div className="flex items-center gap-2 bg-[#DF07070A] rounded-full px-7 py-3 xl:pl-9 xl:py-4 w-full ">
      <Icon icon="formkit:warning" className="w-6 h-6 xl:w-8 xl:h-8" color="#DF0707" />
      <p className='text-[#DF0707] text-sm xl:text-base font-cabin font-normal'>Your account is in danger of being suspended, please complete your identity verification within 72hrs.</p>
    </div>
  )
}

export default AlertNotification
