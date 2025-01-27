import { useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'

const Inactive = () => {
  const {setHeaderName, setNavName} = useOutletContext();

  useEffect(() => {
    setHeaderName("Products");
    setNavName("Inactive");
  }, []);

  return (
    <div className='flex flex-col justify-center items-center h-[80dvh]'>
      <h1>No Inactive Products Found</h1>
    </div>
  )
}

export default Inactive
