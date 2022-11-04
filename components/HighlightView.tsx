import { Coordinate2D } from "../models/UnitConstellation.model"
import { RenderSettings } from "../services/SettingsService"
import { buildTileId } from "../utils/coordinateUtils"
import TileView from "./TileView"

const HighlightView = (props: {
  coordinates: Coordinate2D[]
  color: string
}) => {
  return (
    <>
      {props.coordinates.map(([row, col], index) => {
        return (
          <TileView
            tileId={buildTileId([row, col])}
            key={"highlight_" + row + "_" + col + "_" + index}
            position="absolute"
            zIndex={1}
            top={row * RenderSettings.tileSize + "px"}
            left={col * RenderSettings.tileSize + "px"}
            background={props.color}
            borderRadius="xl"
            pointerEvents="none"
            opacity={0.7}
          />
        )
      })}
    </>
  )
}

export default HighlightView
