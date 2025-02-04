import { useContext, useEffect, useRef } from 'react'
import { ExtensionContext } from '@looker/extension-sdk-react'
import { useDispatch } from 'react-redux'
import {setCurrentUser, setIsDevMode} from '../slices/assistantSlice'
import { useErrorBoundary } from 'react-error-boundary'

export const useCurrentUser = () => {
  const { core40SDK } = useContext(ExtensionContext)
  const dispatch = useDispatch()
  const { showBoundary } = useErrorBoundary()

  // Create a ref to track if the hook has already been called
  const hasFetched = useRef(false)

  useEffect(() => {
    hasFetched.current = true

    const fetchCurrentUser = async () => {
      try {
        const [currentUser, session] = await Promise.all([core40SDK.ok(core40SDK.me()), core40SDK.ok(core40SDK.session())])

        dispatch(setCurrentUser(currentUser))
        dispatch(setIsDevMode(session.workspace_id === 'dev'))
      } catch (error) {
        showBoundary(error)
        throw error
      }
    }

    fetchCurrentUser()
  }, [])
}
