/* eslint-disable max-classes-per-file */

interface ILoadLastEventRepository {
  loadLastEvent: (groupId: string) => Promise<undefined>;
}

class LoadLastEventRepositorySpy implements ILoadLastEventRepository {
  groupId?: string;
  callsCount = 0;
  output: undefined;

  async loadLastEvent(groupId: string): Promise<undefined> {
    this.groupId = groupId;
    this.callsCount += 1;

    return this.output;
  }
}

class CheckLastEventStatus {
  constructor(
    private readonly loadLastEventRepository: ILoadLastEventRepository,
  ) {}
  async perform(groupId: string): Promise<string> {
    await this.loadLastEventRepository.loadLastEvent(groupId);

    return 'done';
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
  it('Should get last event data', async () => {
    const { sut, loadLastEventRepository } = makeSut();

    await sut.perform('any_data');

    expect(loadLastEventRepository.groupId).toBe('any_data');
    expect(loadLastEventRepository.callsCount).toBe(1);
  });

  it('Should return status done when group has no event', async () => {
    const { sut } = makeSut();

    const status = await sut.perform('any_data');

    expect(status).toBe('done');
  });
});
