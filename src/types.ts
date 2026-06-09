export interface Chamber {
  id: string; // "L-01", "L-02", etc.
  name: string;
  tagline: string;
  index: number; // 0 to 8
}

export const CHAMBERS: Chamber[] = [
  {
    id: "L-01",
    name: "ENTRY",
    tagline: "Where Ideas Become Reality",
    index: 0,
  },
  {
    id: "L-02",
    name: "THINKING",
    tagline: "Visualizing the Assembling of Thoughts",
    index: 1,
  },
  {
    id: "L-03",
    name: "ECOSYSTEM",
    tagline: "The Connected Neural Network of Ideas",
    index: 2,
  },
  {
    id: "L-04",
    name: "G.GAME",
    tagline: "Creating Worlds Worth Exploring",
    index: 3,
  },
  {
    id: "L-05",
    name: "G.TRANS",
    tagline: "Communication Beyond Language",
    index: 4,
  },
  {
    id: "L-06",
    name: "THE ENGINE",
    tagline: "Information-Driven Process Mechanics",
    index: 5,
  },
  {
    id: "L-07",
    name: "SHOWCASE",
    tagline: "Spatially Assembled Creative Hardware",
    index: 6,
  },
  {
    id: "L-08",
    name: "FUTURE",
    tagline: "The Next Experiment Starts Here",
    index: 7,
  },
  {
    id: "L-09",
    name: "CONTACT",
    tagline: "Enter Your Coordinate parameters",
    index: 8,
  },
];
