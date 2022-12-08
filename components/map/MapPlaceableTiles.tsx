import { Coordinate2D } from "../../models/UnitConstellation.model"
import { MapHighlights } from "./MapHighlights"

interface MapPlaceableTilesProps {
  placeableCoordinates: Coordinate2D[]
}
export const MapPlaceableTiles = (props: MapPlaceableTilesProps) => (
  <MapHighlights coordinates={props.placeableCoordinates} color={"green.900"} />
)
