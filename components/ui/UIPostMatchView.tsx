import { Button, Center, Heading, Text, VStack } from "@chakra-ui/react"
import { Participant } from "@prisma/client"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import KoFiLogo from "../../assets/images/kofi_logo.png"
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
    <Center width="full">
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
            ? RenderSettings.getPlayerAppearance(props.winner.playerNumber)
                .unit + " wins!"
            : "Draw!"}
        </Text>
        <Button
          width="full"
          onClick={() => {
            onBackToMenuClick()
          }}
        >
          Back to menu
        </Button>
        <Button
          bg="#13C3FF"
          _hover={{ bg: "#47d1ff" }}
          leftIcon={
            <Image
              src={KoFiLogo}
              alt="Buy Me a Coffee at ko-fi.com"
              width="36px"
              height="36px"
            />
          }
        >
          <Link href="https://ko-fi.com/I2I1FR7RZ">Support me</Link>
        </Button>
      </VStack>
    </Center>
  )
}
