import { Card, Placeholder } from "react-bootstrap";

export const PlaylistImage = ({ width = 150, height = 150 }) => {
  return (
    <Card
      className="playlist-image"
      style={{ width: width, height: height }}
      bg="Secondary"
    >
      <Card.Body>
        <Placeholder as={Card.Title} animation="glow" />
      </Card.Body>
    </Card>
  );
};

export default { PlaylistImage };
