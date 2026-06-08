import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateConcertDto } from './create-concert.dto';

describe('CreateConcertDto', () => {
  const build = (overrides: Partial<CreateConcertDto>) =>
    plainToInstance(CreateConcertDto, {
      name: 'Concert',
      description: 'A show',
      totalSeats: 100,
      ...overrides,
    });

  it('accepts a valid payload', async () => {
    const errors = await validate(build({}));
    expect(errors).toHaveLength(0);
  });

  it('rejects an empty name', async () => {
    const errors = await validate(build({ name: '' }));
    expect(errors.map((e) => e.property)).toContain('name');
  });

  it('rejects a non-positive seat count', async () => {
    const errors = await validate(build({ totalSeats: 0 }));
    expect(errors.map((e) => e.property)).toContain('totalSeats');
  });

  it('rejects a non-integer seat count', async () => {
    const errors = await validate(build({ totalSeats: 1.5 }));
    expect(errors.map((e) => e.property)).toContain('totalSeats');
  });
});
