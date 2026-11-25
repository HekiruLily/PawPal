import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { deepEqual, rejects } from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { get, ref, remove, set, update } from 'firebase/database';

const require = createRequire(import.meta.url);

let env;
const pet = {
  ownerId: 'alice',
  name: 'Bơ',
  species: 'Chó',
  breed: '',
  age: 2,
  size: 'Vừa',
  gender: 'Cái',
  notes: '',
  imageURL: '',
};
const service = {
  name: 'Tắm',
  category: 'Tắm',
  description: '',
  price: 180000,
  duration: 60,
  active: true,
  imageURL: '',
  revision: 0,
};
const db = uid =>
  env.authenticatedContext(uid, { email: `${uid}@pawpal.test` }).database();
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-pawpal',
    database: {
      host: '127.0.0.1',
      port: 9000,
      rules: readFileSync('database.rules.json', 'utf8'),
    },
  });
});
beforeEach(async () => {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async context => {
    await set(ref(context.database()), {
      roles: { manager: 'manager' },
      pets: { alice: { p1: pet } },
      services: { s1: service },
    });
  });
});
after(async () => {
  await env?.cleanup();
});
test('profile contact details remain private and cannot grant a role or change email', async () => {
  const profile = { name: 'Alice', email: 'alice@pawpal.test', phoneNumber: '0912 345 678', address: 'Số 24' };
  await assertSucceeds(set(ref(db('alice'), 'users/alice'), profile));
  await assertSucceeds(update(ref(db('alice'), 'users/alice'), { phoneNumber: '+84 (912) 345-678', address: '' }));
  for (const uid of ['bob', 'manager']) {
    await assertFails(get(ref(db(uid), 'users/alice')));
    await assertFails(update(ref(db(uid), 'users/alice'), { name: 'Forged' }));
  }
  for (const invalid of [{ email: 'other@pawpal.test' }, { role: 'manager' }, { phoneNumber: 'abc1234' }, { phoneNumber: '123' }, { address: 'x'.repeat(161) }]) {
    await assertFails(update(ref(db('alice'), 'users/alice'), invalid));
  }
});
test('anonymous users cannot read or write pets and services', async () => {
  const database = env.unauthenticatedContext().database();
  await assertFails(get(ref(database, 'services')));
  await assertFails(set(ref(database, 'pets/alice/p2'), pet));
});
test('owner can read, create, edit and delete a pet', async () => {
  const database = db('alice');
  await assertSucceeds(get(ref(database, 'pets/alice')));
  await assertSucceeds(set(ref(database, 'pets/alice/p2'), pet));
  await assertSucceeds(
    update(ref(database, 'pets/alice/p2'), { name: 'Bơ mới' }),
  );
  await assertSucceeds(remove(ref(database, 'pets/alice/p2')));
});
test('other customer and manager cannot read or edit private pet records', async () => {
  for (const uid of ['bob', 'manager']) {
    await assertFails(get(ref(db(uid), 'pets/alice')));
    await assertFails(
      set(ref(db(uid), 'pets/alice/p1'), { ...pet, name: 'forged' }),
    );
  }
});
test('pet owner cannot forge ownership or save an invalid age or extra fields', async () => {
  for (const invalid of [
    { ownerId: 'bob' },
    { age: -1 },
    { age: 1.5 },
    { age: 31 },
    { imageURL: 'file:///photo.jpg' },
    { admin: true },
  ]) {
    await assertFails(
      set(ref(db('alice'), 'pets/alice/p1'), { ...pet, ...invalid }),
    );
  }
});
test('booked pets are protected and clients cannot remove the booking index', async () => {
  await env.withSecurityRulesDisabled(async context =>
    set(ref(context.database(), 'petBookings/alice/p1/b1'), true),
  );
  await assertFails(remove(ref(db('alice'), 'pets/alice/p1')));
  await assertFails(remove(ref(db('alice'), 'petBookings/alice/p1')));
});
test('clients cannot promote themselves, but can read their own role', async () => {
  await assertFails(set(ref(db('alice'), 'roles/alice'), 'manager'));
  await assertFails(
    update(ref(db('alice')), {
      'roles/alice': 'manager',
      'services/s2': service,
    }),
  );
  await assertSucceeds(get(ref(db('manager'), 'roles/manager')));
  await assertFails(get(ref(db('alice'), 'roles/manager')));
});
test('customer can read services but only manager can create or update', async () => {
  await assertSucceeds(get(ref(db('alice'), 'services')));
  await assertFails(set(ref(db('alice'), 'services/s2'), service));
  await assertSucceeds(set(ref(db('manager'), 'services/s2'), service));
  await assertSucceeds(
    set(ref(db('manager'), 'services/s1'), {
      ...service,
      active: false,
      price: 200000,
      revision: 1,
    }),
  );
});
test('manager cannot hard delete or bypass validation or revision checks', async () => {
  const target = ref(db('manager'), 'services/s1');
  await assertFails(remove(target));
  for (const invalid of [
    { price: -1 },
    { price: 0 },
    { price: 1.5 },
    { price: 1000000000 },
    { duration: 4 },
    { duration: 601 },
    { active: 'true' },
    { extra: true },
    { revision: 0 },
    { revision: 5 },
    { discountPercent: 101 },
    { discountPercent: 15 },
    { promotionStart: 'tomorrow' },
  ]) {
    await assertFails(set(target, { ...service, revision: 1, ...invalid }));
  }
});

test('manager can store valid promotions and invalid offers are rejected', async () => {
  const target = ref(db('manager'), 'services/s2');
  await assertSucceeds(
    set(target, {
      ...service,
      discountPercent: 15,
      promotionStart: '2026-11-01',
      promotionEnd: '2026-11-30',
    }),
  );
  await assertFails(
    set(target, {
      ...service,
      revision: 1,
      discountPercent: 15,
      promotionStart: '2026-12-01',
      promotionEnd: '2026-11-30',
    }),
  );
  await assertFails(
    set(target, {
      ...service,
      revision: 1,
      discountPercent: 15.5,
      promotionStart: '2026-11-01',
      promotionEnd: '2026-11-30',
    }),
  );
  await assertFails(
    set(ref(db('alice'), 'services/s3'), {
      ...service,
      discountPercent: 100,
      promotionStart: '2026-11-01',
      promotionEnd: '2026-11-30',
    }),
  );
});
test('users can save their profile but cannot inject a role or write another user', async () => {
  await assertSucceeds(
    set(ref(db('alice'), 'users/alice'), {
      name: 'Alice',
      email: 'alice@pawpal.test',
    }),
  );
  await assertFails(
    set(ref(db('alice'), 'users/alice'), {
      name: 'Alice',
      email: 'alice@pawpal.test',
      role: 'manager',
    }),
  );
  await assertFails(
    set(ref(db('alice'), 'users/bob'), {
      name: 'Alice',
      email: 'alice@pawpal.test',
    }),
  );
});

test('actual pet and service modules work against rules, including a cold transaction client', async () => {
  // Compile the real TypeScript modules in memory; only project configuration is
  // injected. Firebase reads, writes and transactions use the real local server.
  const { transformFileSync } = require('@babel/core');
  const load = (module, filename) => {
    const { code } = transformFileSync(filename, {
      babelrc: false,
      configFile: false,
      presets: ['module:@react-native/babel-preset'],
    });
    module._compile(code, filename);
  };
  const previousTs = require.extensions['.ts'];
  const previousTsx = require.extensions['.tsx'];
  require.extensions['.ts'] = load;
  require.extensions['.tsx'] = load;
  const configuration = require.resolve('../src/services/firebaseService.ts');
  const previousConfiguration = require.cache[configuration];
  let uid = 'alice';
  let database = db(uid);
  require.cache[configuration] = {
    id: configuration,
    filename: configuration,
    loaded: true,
    exports: {
      getFirebase: () => ({ database, auth: { currentUser: { uid } } }),
    },
  };
  try {
    const { savePet, deletePet } = require('../src/services/petService.ts');
    const saved = await savePet({ ...pet, age: '2', name: 'Mít' });
    await assertSucceeds(get(ref(database, `pets/alice/${saved.id}`)));
    await deletePet(saved.id);
    if ((await get(ref(database, `pets/alice/${saved.id}`))).exists()) {
      throw new Error('Pet was not deleted');
    }
    uid = 'manager';
    database = db(uid);
    const {
      observeServices,
      saveService,
    } = require('../src/services/serviceService.ts');
    const offer = {
      ...service,
      discountPercent: 15,
      promotionStart: '2026-11-01',
      promotionEnd: '2026-11-30',
    };
    await env.withSecurityRulesDisabled(async context =>
      set(ref(context.database(), 'services/s1'), offer),
    );
    await env.withSecurityRulesDisabled(async context =>
      set(ref(context.database(), 'services/s2'), {
        ...service,
        name: 'Cắt móng',
      }),
    );
    let stop;
    const listed = await new Promise((resolve, reject) => {
      stop = observeServices(resolve, reject);
    });
    stop();
    deepEqual(
      listed.map(item => item.id),
      ['s1', 's2'],
    );
    const draft = { ...service, price: '200000', duration: '60' };
    await saveService(draft, { ...offer, id: 's1' });
    const latest = (await get(ref(database, 'services/s1'))).val();
    if (
      latest.price !== 200000 ||
      latest.revision !== 1 ||
      latest.discountPercent !== 15 ||
      latest.promotionEnd !== offer.promotionEnd
    ) {
      throw new Error('Service update was not committed');
    }
    await rejects(
      saveService({ ...draft, price: '250000' }, { ...service, id: 's1' }),
      /vừa thay đổi/,
    );
    uid = 'alice';
    database = db(uid);
    await assertFails(saveService(draft));
  } finally {
    if (previousConfiguration) {
      require.cache[configuration] = previousConfiguration;
    } else {
      delete require.cache[configuration];
    }
    if (previousTs) {
      require.extensions['.ts'] = previousTs;
    } else {
      delete require.extensions['.ts'];
    }
    if (previousTsx) {
      require.extensions['.tsx'] = previousTsx;
    } else {
      delete require.extensions['.tsx'];
    }
  }
});
