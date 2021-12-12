/* eslint-disable max-classes-per-file */

interface ILoadLastEventRepository {
  loadLastEvent: (groupId: string) => Promise<void>;
}

class LoadLastEventRepositoryMock implements ILoadLastEventRepository {
  groupId?: string;
  callsCount = 0;

  async loadLastEvent(groupId: string): Promise<void> {
    this.groupId = groupId;
    this.callsCount += 1;
  }
}

class CheckLastEventStatus {
  constructor(
    private readonly loadLastEventRepository: ILoadLastEventRepository,
  ) {}
  async perform(groupId: string): Promise<void> {
    await this.loadLastEventRepository.loadLastEvent(groupId);
  }
}

describe('CheckLastEventStatus', () => {
  it('Should get last event data', async () => {
    const loadLastEventRepository = new LoadLastEventRepositoryMock();
    const checkLastEventStatus = new CheckLastEventStatus(
      loadLastEventRepository,
    );

    await checkLastEventStatus.perform('any_data');

    expect(loadLastEventRepository.groupId).toBe('any_data');
    expect(loadLastEventRepository.callsCount).toBe(1);
  });
});
