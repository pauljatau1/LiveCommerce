import {useCallback} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
export const studioBackPlan = ({index=0,pathname,state={},fallback='/studio'}) => {
  const requested=state.returnTo || state.back || state.from || fallback;
  const target=typeof requested==='string' && /^\/studio(?:[/?#]|$)/.test(requested) && requested.split(/[?#]/)[0]!==pathname ? requested : '/studio';
  return index>0 && !state.studioRedirect ? {delta:-1} : {to:target,replace:true};
};
export default function useStudioBack(fallback='/studio') {
  const location=useLocation(),navigate=useNavigate();
  return useCallback(()=>{const plan=studioBackPlan({index:window.history.state?.idx,pathname:location.pathname,state:location.state || {},fallback});if(plan.delta)navigate(plan.delta);else navigate(plan.to,{replace:true});},[location.pathname,location.state,navigate,fallback]);
}
