/* eslint-disable max-classes-per-file */
import { set, reset } from 'mockdate';

interface ILoadLastEventRepository {
  loadLastEvent: (
    groupId: string,
  ) => Promise<{ endDate: Date; reviewDurationInHours: number } | undefined>;
}

class LoadLastEventRepositorySpy implements ILoadLastEventRepository {
  groupId?: string;
  callsCount = 0;
  output?: { endDate: Date; reviewDurationInHours: number };

  async loadLastEvent(
    groupId: string,
  ): Promise<{ endDate: Date; reviewDurationInHours: number } | undefined> {
    this.groupId = groupId;
    this.callsCount += 1;

    return this.output;
  }
}

class EventStatus {
  status: 'active' | 'inReview' | 'done';

  constructor(event?: { endDate: Date; reviewDurationInHours: number }) {
    const now = new Date();

    if (!event) {
      this.status = 'done';
      return;
    }

    if (event.endDate >= now) {
      this.status = 'active';
      return;
    }

    const reviewDurationInMs = event.reviewDurationInHours * 3600000;

    const reviewDate = new Date(event.endDate.getTime() + reviewDurationInMs);

    this.status = reviewDate >= now ? 'inReview' : 'done';
  }
}

class CheckLastEventStatus {
  constructor(
    private readonly loadLastEventRepository: ILoadLastEventRepository,
  ) {}
  async perform(input: { groupId: string }): Promise<EventStatus> {
    const event = await this.loadLastEventRepository.loadLastEvent(
      input.groupId,
    );

    return new EventStatus(event);
  }
}
type SutTypes = {
  sut: CheckLastEventStatus;
  loadLastEventRepository: LoadLastEventRepositorySpy;
};

const makeSut = (): SutTypes => {
  const loadLastEventRepository = new LoadLastEventRepositorySpy();

  const sut = new CheckLastEventStatus(loadLastEventRepository);

  return {
    sut,
    loadLastEventRepository,
  };
};

describe('CheckLastEventStatus', () => {
  const groupId = 'any_group_id';

  beforeAll(() => {
    set(new Date());
  });

  afterAll(() => {
    reset();
  });

  it('Should get last event data', async () => {
    const { sut, loadLastEventRepository } = makeSut();

    await sut.perform({ groupId });

    expect(loadLastEventRepository.groupId).toBe('any_group_id');
    expect(loadLastEventRepository.callsCount).toBe(1);
  });

  it('Should return status done when group has no event', async () => {
    const { sut, loadLastEventRepository } = makeSut();

    loadLastEventRepository.output = undefined;

    const eventStatus = await sut.perform({ groupId });

    expect(eventStatus.status).toBe('done');
  });

  it('Should return status active when now is before event end time', async () => {
    const { sut, loadLastEventRepository } = makeSut();

    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() + 1),
      reviewDurationInHours: 1,
    };

    const eventStatus = await sut.perform({ groupId });

    expect(eventStatus.status).toBe('active');
  });

  it('Should return status inReview when now is after event end time', async () => {
    const { sut, loadLastEventRepository } = makeSut();

    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() - 1),
      reviewDurationInHours: 1,
    };

    const eventStatus = await sut.perform({ groupId });

    expect(eventStatus.status).toBe('inReview');
  });

  it('Should return status active when now is equal to event end time', async () => {
    const { sut, loadLastEventRepository } = makeSut();

    loadLastEventRepository.output = {
      endDate: new Date(),
      reviewDurationInHours: 1,
    };

    const eventStatus = await sut.perform({ groupId });

    expect(eventStatus.status).toBe('active');
  });

  it('Should return status inReview when now is before review time', async () => {
    const reviewDurationInHours = 1;
    const reviewDurationInMs = 3600000;

    const { sut, loadLastEventRepository } = makeSut();

    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() - reviewDurationInMs + 1),
      reviewDurationInHours,
    };

    const eventStatus = await sut.perform({ groupId });

    expect(eventStatus.status).toBe('inReview');
  });

  it('Should return status inReview when now equal to review time', async () => {
    const reviewDurationInHours = 1;
    const reviewDurationInMs = 3600000;

    const { sut, loadLastEventRepository } = makeSut();

    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() - reviewDurationInMs),
      reviewDurationInHours,
    };

    const eventStatus = await sut.perform({ groupId });

    expect(eventStatus.status).toBe('inReview');
  });

  it('Should return status done when now is after review time', async () => {
    const reviewDurationInHours = 1;
    const reviewDurationInMs = 3600000;

    const { sut, loadLastEventRepository } = makeSut();

    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() - reviewDurationInMs - 1),
      reviewDurationInHours,
    };

    const eventStatus = await sut.perform({ groupId });

    expect(eventStatus.status).toBe('done');
  });
});
