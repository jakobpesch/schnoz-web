import { Tile } from "./tile"

export interface Map {
  [id: Tile["id"]]: Tile
}
