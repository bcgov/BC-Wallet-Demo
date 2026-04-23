interface SecondaryNavbarTab {
  id: string
  label: string
}

interface SecondaryNavbarProps {
  tabs: SecondaryNavbarTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function SecondaryNavbar({ tabs, activeTab, onTabChange }: SecondaryNavbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex gap-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`pb-2 font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-bcgov-blue-light text-bcgov-blue-light'
                : 'border-transparent text-bcgov-darkgrey hover:text-bcgov-black'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
