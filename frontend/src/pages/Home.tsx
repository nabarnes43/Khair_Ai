import { FC } from 'react'
import HairClassifierTest from '../components/HairClassifierTest'

/**
 * Home page component
 * @returns Home page with hair classifier test
 */
const Home: FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <HairClassifierTest />
    </div>
  )
}

export default Home 