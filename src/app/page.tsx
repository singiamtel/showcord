import Rooms from './rooms'
import Messages from './chat'
import Users from './users'

export default function Home() {
  return (
  	<div className="h-full flex bg-gray-300 w-full">
		{/* JSX comment*/}
		<div className="w-1/6"><Rooms/></div>
		<div className="w-full bg-gray-300"><Messages/></div>
		<div className="w-1/6"><Users/></div>
  	</div>
  )
}
