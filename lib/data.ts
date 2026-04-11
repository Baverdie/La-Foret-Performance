import prisma from './prisma';

export interface PublicMember {
  id: string;
  name: string;
  instagram: string;
  photo: string;
  bio: string;
  cars: PublicCar[];
  createdAt: string;
}

export interface PublicCar {
  id: string;
  model: string;
  year: string;
  photos: string[];
  containPhotos: number[];
  engine: string;
  power: string;
  modifications: string;
  story: string;
  owner: string;
  ownerInstagram: string;
}

export interface PublicEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  photo: string | null;
  status: 'past' | 'upcoming';
}

export async function getPublicMembers(): Promise<PublicMember[]> {
  const members = await prisma.member.findMany({
    where: { isActive: true },
    include: {
      cars: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  return members.map((member) => ({
    id: member.id,
    name: member.name,
    instagram: member.instagram,
    photo: member.photo,
    bio: member.bio,
    createdAt: member.createdAt.toISOString(),
    cars: member.cars.map((car) => ({
      id: car.id,
      model: car.model,
      year: car.year,
      photos: car.photos,
      containPhotos: car.containPhotos,
      engine: car.engine,
      power: car.power,
      modifications: car.modifications,
      story: car.story,
      owner: member.name,
      ownerInstagram: member.instagram,
    })),
  }));
}

export async function getPublicCars(): Promise<PublicCar[]> {
  const cars = await prisma.car.findMany({
    where: { isActive: true },
    include: {
      member: true,
    },
    orderBy: { order: 'asc' },
  });

  return cars.map((car) => ({
    id: car.id,
    model: car.model,
    year: car.year,
    photos: car.photos,
    containPhotos: car.containPhotos,
    engine: car.engine,
    power: car.power,
    modifications: car.modifications,
    story: car.story,
    owner: car.member.name,
    ownerInstagram: car.member.instagram,
  }));
}

export async function getPublicEvents(): Promise<PublicEvent[]> {
  const events = await prisma.event.findMany({
    orderBy: { date: 'desc' },
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return events.map((event) => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    const status: 'past' | 'upcoming' = eventDate < now ? 'past' : 'upcoming';

    return {
      id: event.id,
      title: event.title,
      date: event.date.toISOString(),
      location: event.location,
      description: event.description,
      photo: event.photo,
      status,
    };
  });
}
