import React, { useRef, useState } from 'react'

import Message from './Message'
import { useContext } from 'react'
import { ExtensionContext } from '@looker/extension-sdk-react'
import { useDispatch } from 'react-redux'
import {
  openSidePanel,
  setSidePanelExploreUrl,
  setSnackbar,
} from '../../slices/assistantSlice'
import { OpenInNew, ThumbDown, ThumbUp } from '@material-ui/icons'
import { Button, ClickAwayListener, Popper, TextField } from '@mui/material'
import clsx from 'clsx'
import { useFeedback } from '../../hooks/useFeedback'

interface ExploreMessageProps {
  exploreId: string
  modelName: string
  prompt: string
  queryArgs: string
}

const ExploreMessage = ({
  modelName,
  exploreId,
  prompt,
  queryArgs,
}: ExploreMessageProps) => {
  const dispatch = useDispatch()
  const { extensionSDK } = useContext(ExtensionContext)
  const exploreHref = `/explore/${modelName}/${exploreId}?${queryArgs}`
  const openExplore = () => {
    extensionSDK.openBrowserWindow(exploreHref, '_blank')
  }

  const { sendUserFeedback } = useFeedback()

  const openSidePanelExplore = () => {
    dispatch(setSidePanelExploreUrl(queryArgs))
    dispatch(openSidePanel())
  }

  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(
    null,
  )
  const [isPositive, setIsPositive] = useState<boolean>()
  const [feedbackComment, setFeedbackComment] = useState('')

  const reset = () => {
    setAnchorElement(null)
    setIsPositive(undefined)
    setFeedbackComment('')
  }

  const handleFeedbackSend = () => {
    sendUserFeedback(isPositive!, feedbackComment)
      .then(() => {
        dispatch(setSnackbar({ type: 'success', message: 'Feedback sent!' }))
      })
      .catch(() => {
        dispatch(
          setSnackbar({ type: 'error', message: 'Failed to send feedback' }),
        )
      })

    reset()
  }

  const feedBackRef = useRef(null)

  return (
    <div>
      <Message actor="system" createdAt={Date.now()}>
        <div className="relative">
          <div className="mb-2">Here is the explore we generated.</div>
          <div
            className="bg-gray-400 text-white rounded-md p-4 my-2 shadow-lg hover:bg-gray-500 cursor-pointer"
            onClick={openSidePanelExplore}
          >
            <div className="flex flex-row text-md font-semibold">
              <div className="flex-grow">Explore</div>
            </div>
            <div className="text-xs mt-2 line-clamp-3">{prompt}</div>
          </div>
          <div ref={feedBackRef} className="flex justify-between gap-x-2">
            <div className="flex gap-x-1.5">
              <ThumbUp
                fontSize="small"
                type="button"
                className={clsx(
                  'hover:cursor-pointer hover:fill-blue-500',
                  anchorElement && isPositive
                    ? 'text-blue-500'
                    : 'text-gray-500',
                )}
                onClick={() => {
                  setAnchorElement(feedBackRef.current)
                  setIsPositive(true)
                }}
              />
              <ThumbDown
                fontSize="small"
                type="button"
                className={clsx(
                  'hover:cursor-pointer hover:fill-blue-500',
                  anchorElement && !isPositive
                    ? 'text-blue-500'
                    : 'text-gray-500',
                )}
                onClick={() => {
                  setAnchorElement(feedBackRef.current)
                  setIsPositive(false)
                }}
              />
            </div>
            <div
              className="cursor-pointer hover:underline text-sm text-blue-500 flex flex-col justify-center items-end"
              onClick={openExplore}
            >
              <div>
                visit <OpenInNew fontSize={'small'} />
              </div>
            </div>
          </div>
        </div>
        <Popper
          anchorEl={anchorElement}
          placement={'bottom-start'}
          className="w-full bg-white drop-shadow-xl rounded-lg z-10"
          open={!!anchorElement}
          disablePortal
        >
          <ClickAwayListener onClickAway={reset}>
            <div className="p-3 border rounded-lg">
              <TextField
                autoFocus
                InputProps={{
                  className: '!p-3',
                }}
                multiline
                minRows={2}
                maxRows={6}
                fullWidth
                placeholder="Comment"
                onChange={(e) => setFeedbackComment(e.target.value)}
                value={feedbackComment}
              />
              <div className="flex justify-end mt-2">
                <Button color="inherit" onClick={reset}>
                  Cancel
                </Button>
                <Button onClick={handleFeedbackSend}>Send</Button>
              </div>
            </div>
          </ClickAwayListener>
        </Popper>
      </Message>
    </div>
  )
}

export default ExploreMessage
