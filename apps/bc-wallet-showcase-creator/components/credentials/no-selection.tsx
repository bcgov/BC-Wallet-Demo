export const NoSelection = ({ text }: { text: string }) => {
  return (
    <div className="border border-light dark:border-dark w-full flex items-center justify-center no-selection">
      <p className="text-center">{text}</p>
    </div>
  )
}
