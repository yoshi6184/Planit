import { createContext, useContext } from 'react'

const PlanTopBarContext = createContext(null)

export function PlanTopBarProvider({ children, readyToAssignNode }) {
  return (
    <PlanTopBarContext.Provider value={readyToAssignNode}>
      {children}
    </PlanTopBarContext.Provider>
  )
}

export function usePlanTopBar() {
  return useContext(PlanTopBarContext)
}
