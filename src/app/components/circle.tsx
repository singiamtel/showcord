// Circle around text
export default function Circle({ children, className }: { children: any, className?: string }) {
  return (
    <div className={"relative w-4 h-4 bg-red-400 rounded-full flex justify-center items-center text-center p-2 shadow-xl " + className }>
      <span className="absolute text-sm text-purple-800">
      {children}
      </span>
   </div>
  )
}
