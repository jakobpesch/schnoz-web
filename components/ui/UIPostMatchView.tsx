import { VStack, Heading, Button, Text } from "@chakra-ui/react"
import { Match, Participant } from "@prisma/client"
import { useRouter } from "next/router"
import { RenderSettings } from "../../services/SettingsService"

interface UIPostMatchViewProps {
  winner: Participant | null
}
export const UIPostMatchView = (props: UIPostMatchViewProps) => {
  const router = useRouter()
  const onBackToMenuClick = async () => {
    router.push("/")
  }
  return (
    <VStack
      p="1vw"
      bg="gray.800"
      spacing="1vw"
      position="absolute"
      borderRadius="0.5vw"
      borderWidth="0.08vw"
      zIndex={2}
      top="10vw"
    >
      <Heading>Finished</Heading>
      <Text fontSize="2vw">
        {props.winner
          ? RenderSettings.getPlayerAppearance(props.winner).unit + "wins!"
          : "Draw!"}
      </Text>
      <Button
        onClick={() => {
          onBackToMenuClick()
        }}
      >
        Back to menu
      </Button>
    </VStack>
  )
}
