import client from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
  try {
    await client.connect();
    const db = client.db('bloodDonationDB');
    
    console.log('🌱 Starting database seeding...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await db.collection('users').deleteMany({});
    // await db.collection('donationRequests').deleteMany({});
    // await db.collection('funding').deleteMany({});

    // Create Admin User
    const adminUser = {
      email: 'admin@blooddonor.com',
      name: 'Admin User',
      avatar: 'https://i.ibb.co/9ZKMjYY/admin-avatar.jpg',
      bloodGroup: 'O+',
      district: 'Dhaka',
      upazila: 'Dhanmondi',
      password: 'admin123', // In production, hash this!
      role: 'admin',
      status: 'active',
      createdAt: new Date()
    };

    const existingAdmin = await db.collection('users').findOne({ email: adminUser.email });
    if (!existingAdmin) {
      await db.collection('users').insertOne(adminUser);
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Create Test Donors
    const donors = [
      {
        email: 'johncena@example.com',
        name: 'John cena',
        avatar: 'https://i.pravatar.cc/150?img=1',
        bloodGroup: 'A+',
        district: 'Dhaka',
        upazila: 'Gulshan',
        password: 'password123',
        role: 'donor',
        status: 'active',
        createdAt: new Date()
      },
      {
        email: 'moon@example.com',
        name: 'Moon Knight',
        avatar: 'https://i.pravatar.cc/150?img=5',
        bloodGroup: 'B+',
        district: 'Chattogram',
        upazila: 'Patenga',
        password: 'password123',
        role: 'donor',
        status: 'active',
        createdAt: new Date()
      },
      {
        email: 'taoshif@example.com',
        name: 'Taoshif Gazi',
        avatar: 'https://i.pravatar.cc/150?img=3',
        bloodGroup: 'O-',
        district: 'Rajshahi',
        upazila: 'Boalia',
        password: 'password123',
        role: 'donor',
        status: 'active',
        createdAt: new Date()
      },
      {
        email: 'sarah@example.com',
        name: 'Sarah Sheikh',
        avatar: 'https://i.pravatar.cc/150?img=9',
        bloodGroup: 'AB+',
        district: 'Sylhet',
        upazila: 'Jalalabad',
        password: 'password123',
        role: 'donor',
        status: 'active',
        createdAt: new Date()
      },
      {
        email: 'volunteer@blooddonor.com',
        name: 'Volunteer User',
        avatar: 'https://i.pravatar.cc/150?img=7',
        bloodGroup: 'A-',
        district: 'Khulna',
        upazila: 'Sonadanga',
        password: 'volunteer123',
        role: 'volunteer',
        status: 'active',
        createdAt: new Date()
      }
    ];

    for (const donor of donors) {
      const existing = await db.collection('users').findOne({ email: donor.email });
      if (!existing) {
        await db.collection('users').insertOne(donor);
        console.log(`✅ Donor ${donor.name} created`);
      }
    }

    // Create Test Donation Requests
    const donationRequests = [
      {
        requesterName: 'Abu Gifor',
        requesterEmail: 'ag@example.com',
        recipientName: 'Patient A',
        recipientDistrict: 'Dhaka',
        recipientUpazila: 'Dhanmondi',
        hospitalName: 'Dhaka Medical College Hospital',
        fullAddress: 'Zahir Raihan Rd, Dhaka',
        bloodGroup: 'A+',
        donationDate: new Date('2025-12-15'),
        donationTime: '10:00',
        requestMessage: 'Urgently need blood for surgery. Patient is critical.',
        donationStatus: 'pending',
        donorInfo: null,
        createdAt: new Date()
      },
      {
        requesterName: 'monsor Ali',
        requesterEmail: 'moonsurali@example.com',
        recipientName: 'Patient B',
        recipientDistrict: 'Chattogram',
        recipientUpazila: 'Patenga',
        hospitalName: 'Chattogram Medical College',
        fullAddress: 'K.B. Fazlul Kader Rd, Chattogram',
        bloodGroup: 'B+',
        donationDate: new Date('2025-12-12'),
        donationTime: '14:00',
        requestMessage: 'Need blood for emergency operation.',
        donationStatus: 'pending',
        donorInfo: null,
        createdAt: new Date()
      },
      {
        requesterName: 'Mike Jade',
        requesterEmail: 'mike@example.com',
        recipientName: 'Patient C',
        recipientDistrict: 'Rajshahi',
        recipientUpazila: 'Boalia',
        hospitalName: 'Rajshahi Medical College',
        fullAddress: 'Laxmipur, Rajshahi',
        bloodGroup: 'O-',
        donationDate: new Date('2025-12-20'),
        donationTime: '09:00',
        requestMessage: 'Accident victim needs immediate blood transfusion.',
        donationStatus: 'inprogress',
        donorInfo: {
          name: 'Sarah Sheikh',
          email: 'sarah@example.com'
        },
        createdAt: new Date()
      },
      {
        requesterName: 'Sarah Williamshaker',
        requesterEmail: 'sarahshaker@example.com',
        recipientName: 'Patient D',
        recipientDistrict: 'Sylhet',
        recipientUpazila: 'Jalalabad',
        hospitalName: 'Sylhet MAG Osmani Medical College',
        fullAddress: 'Medical College Rd, Sylhet',
        bloodGroup: 'AB+',
        donationDate: new Date('2025-12-18'),
        donationTime: '11:00',
        requestMessage: 'Cancer patient needs regular blood supply.',
        donationStatus: 'pending',
        donorInfo: null,
        createdAt: new Date()
      }
    ];

    await db.collection('donationRequests').insertMany(donationRequests);
    console.log('✅ Donation requests created');

    // Create Test Funding Records
    const fundingRecords = [
      {
        userName: 'John cena',
        userEmail: 'johncena@example.com',
        amount: 50,
        transactionId: 'pi_test_1234567890',
        fundingDate: new Date('2025-12-01')
      },
      {
        userName: 'Moon Knight',
        userEmail: 'moon@example.com',
        amount: 100,
        transactionId: 'pi_test_0987654321',
        fundingDate: new Date('2025-12-05')
      },
      {
        userName: 'Taoshif Gazi',
        userEmail: 'taoshifgazi@example.com',
        amount: 25,
        transactionId: 'pi_test_1122334455',
        fundingDate: new Date('2025-12-08')
      }
    ];

    await db.collection('funding').insertMany(fundingRecords);
    console.log('✅ Funding records created');

    console.log('\n🎉 Database seeding completed!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@blooddonor.com / admin123');
    console.log('Volunteer: volunteer@blooddonor.com / volunteer123');
    console.log('Donor: john@example.com / password123');

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();