import {
  Box,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
} from "@chakra-ui/react"
import { ReactNode, useEffect, useState } from "react"

export const HoveredTooltip = (props: {
  trigger: ReactNode
  header?: ReactNode
  body?: ReactNode
  footer?: ReactNode
}) => {
  const [hovering, setHovering] = useState(false)
  useEffect(() => {
    console.log("useEffect:hovering", hovering)
    let timer: NodeJS.Timeout
    if (!hovering) {
      setIsOpen(false)
    } else {
      timer = setTimeout(() => {
        console.log("setTimeout:hovering", hovering)
        setIsOpen(true)
      }, 1000)
    }
    return () => {
      clearTimeout(timer)
    }
  }, [hovering])
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover
      isOpen={isOpen}
      placement="left-start"
      autoFocus={false}
      preventOverflow
    >
      <PopoverArrow />
      <PopoverTrigger>
        <Box
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {props.trigger}
        </Box>
      </PopoverTrigger>
      <PopoverContent maxWidth="min-content">
        {props.header && (
          <PopoverHeader fontWeight="bold">{props.header}</PopoverHeader>
        )}
        {props.body && (
          <PopoverBody width="min-content">{props.body}</PopoverBody>
        )}
        {props.footer && (
          <PopoverFooter
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            pb={4}
          >
            {props.footer}
          </PopoverFooter>
        )}
      </PopoverContent>
    </Popover>
  )
}
