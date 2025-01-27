import { useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'

const Drafts = () => {
  const {setHeaderName, setNavName} = useOutletContext();

  useEffect(() => {
    setHeaderName("Products");
    setNavName("Drafts");
  }, []);

  return (
    <div className='flex flex-col justify-center items-center h-[80dvh]'>
      <h1>No Drafts Found</h1>
    </div>
  )
}

export default Drafts
