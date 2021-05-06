import {
  CardActions,
  CardHeader,
  createStyles,
  makeStyles,
  Menu,
  MenuItem,
  Theme,
} from "@material-ui/core";
import { Button } from "@material-ui/core";
import { CardContent } from "@material-ui/core";
import { Card } from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import React, { useState } from "react";
import { Meditation } from "./meditationService";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    cardActions: {
      flex: 1,
      width: "100%",
      justifyContent: "flex-end",
      flexDirection: "row",
    },
    selectorGrid: {
      alignContent: "center",
      justifyContent: "center",
    },
    spinner: {
      height: "100vh",
      flex: 1,
      alignContent: "center",
      justifyContent: "center",
    },
    indicator: {
      background: "white",
      color: "white",
    },
    header: {
      marginBottom: 3,
      padding: 10,
      textAlign: "center",
    },
    appBar: {
      background: theme.palette.grey[600],
    },
  })
);

interface MeditationCardProps {
  meditation: Meditation;
  canEdit: boolean;
  onSelect: (meditation: Meditation) => void;
  onEdit: (meditation: Meditation) => void;
  onDelete: (meditation: Meditation) => void;
}
export const MeditationCard = ({
  meditation,
  canEdit,
  onSelect,
  onEdit,
  onDelete,
}: MeditationCardProps) => {
  const classes = useStyles();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleOpen = (evt: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchor(evt.currentTarget);
  };

  const handleClose = () => {
    setMenuAnchor(null);
  };

  return (
    <React.Fragment>
      <Card>
        <CardHeader
          title={meditation.name}
          action={
            canEdit ? (
              <Button
                aria-controls="simple-menu"
                aria-haspopup="true"
                key={meditation._id}
                size="large"
                onClick={(evt) => {
                  handleOpen(evt);
                }}
              >
                <ExpandMore />
              </Button>
            ) : (
              <div></div>
            )
          }
        />
        <CardContent>{meditation.text}</CardContent>
        <CardActions className={classes.cardActions}>
          <Button
            variant="outlined"
            onClick={() => {
              onSelect(meditation);
            }}
          >
            Select
          </Button>
        </CardActions>
      </Card>
      <Menu
        id={`edit-menu`}
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        keepMounted
        onClose={handleClose}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MenuItem>
          <Button
            style={{ width: 120 }}
            onClick={() => {
              onEdit(meditation);
            }}
          >
            Edit
          </Button>
        </MenuItem>
        <MenuItem>
          <Button
            style={{ width: 120 }}
            onClick={() => {
              onDelete(meditation);
            }}
          >
            Delete
          </Button>
        </MenuItem>
      </Menu>
    </React.Fragment>
  );
};
