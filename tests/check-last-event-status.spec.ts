/* eslint-disable max-classes-per-file */
import { set, reset } from 'mockdate';

interface ILoadLastEventRepository {
  loadLastEvent: (groupId: string) => Promise<{ endDate: Date } | undefined>;
}

class LoadLastEventRepositorySpy implements ILoadLastEventRepository {
  groupId?: string;
  callsCount = 0;
  output?: { endDate: Date };

  async loadLastEvent(groupId: string): Promise<{ endDate: Date } | undefined> {
    this.groupId = groupId;
    this.callsCount += 1;

    return this.output;
  }
}

class CheckLastEventStatus {
  constructor(
    private readonly loadLastEventRepository: ILoadLastEventRepository,
  ) {}
  async perform(input: { groupId: string }): Promise<string> {
    const event = await this.loadLastEventRepository.loadLastEvent(
      input.groupId,
    );

    if (!event) return 'done';

    const now = new Date();

    return event.endDate > now ? 'active' : 'inReview';
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

    const status = await sut.perform({ groupId });

    expect(status).toBe('done');
  });

  it('Should return status active when now is before event end time', async () => {
    const { sut, loadLastEventRepository } = makeSut();

    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() + 1),
    };
    const status = await sut.perform({ groupId });

    expect(status).toBe('active');
  });

  it('Should return status inReview when now is after event end time', async () => {
    const { sut, loadLastEventRepository } = makeSut();

    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() - 1),
    };
    const status = await sut.perform({ groupId });

    expect(status).toBe('inReview');
  });
});
