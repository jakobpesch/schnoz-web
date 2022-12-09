import { Fade, Spinner } from "@chakra-ui/react"
import { useEffect, useState } from "react"
interface UILoadingIndicatorProps {
  loading: boolean
}
export const UILoadingIndicator = (props: UILoadingIndicatorProps) => {
  return (
    <Fade in={props.loading}>
      <Spinner
        size="sm"
        color="gray.700"
        position="absolute"
        top="1"
        left="1"
      />
    </Fade>
  )
}
