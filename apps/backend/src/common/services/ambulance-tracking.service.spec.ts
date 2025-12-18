import { Test, TestingModule } from '@nestjs/testing';
import { AmbulanceTrackingService } from './ambulance-tracking.service';
import { PrismaService } from '../../database/prisma.service';
import { HospitalBoundsService } from './hospital-bounds.service';
import { AmbulancesService } from '../../modules/ambulances/ambulances.service';

describe('AmbulanceTrackingService', () => {
  let service: AmbulanceTrackingService;
  let prismaService: PrismaService;
  let ambulancesService: AmbulancesService;

  const mockPrismaService = {
    ambulance: {
      findFirst: jest.fn(),
    },
    gPSTrackingLog: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    ambulanceZoneLog: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockHospitalBoundsService = {
    validateAmbulancePosition: jest.fn(),
  };

  const mockAmbulancesService = {
    findAllGPS: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AmbulanceTrackingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: HospitalBoundsService, useValue: mockHospitalBoundsService },
        { provide: AmbulancesService, useValue: mockAmbulancesService },
      ],
    }).compile();

    service = module.get<AmbulanceTrackingService>(AmbulanceTrackingService);
    prismaService = module.get<PrismaService>(PrismaService);
    ambulancesService = module.get<AmbulancesService>(AmbulancesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncLocations', () => {
    it('should sync locations successfully', async () => {
      // Mock data
      const mockGPSResponse = {
        status: true,
        data: [
          {
            imei: '123456789012345',
            latitude: 10.0,
            longitude: 20.0,
            timestamp: new Date().toISOString(),
            speed: 50,
            direction: 180,
          },
        ],
      };

      const mockAmbulances = [
        { id: 'amb-1', vehicleImei: '123456789012345' },
      ];

      mockAmbulancesService.findAllGPS.mockResolvedValue(mockGPSResponse);
      mockAmbulancesService.findAll.mockResolvedValue(mockAmbulances);
      mockPrismaService.ambulance.findFirst.mockResolvedValue(mockAmbulances[0]);
      mockHospitalBoundsService.validateAmbulancePosition.mockResolvedValue({
        isWithinAnyHospital: false,
        nearbyHospitals: [],
      });
      mockPrismaService.gPSTrackingLog.findMany.mockResolvedValue([]); // For getPreviousLocation
      mockPrismaService.ambulanceZoneLog.findMany.mockResolvedValue([]); // For handleZoneLogic

      const result = await service.syncLocations();
      console.log('Sync result:', JSON.stringify(result, null, 2));

      expect(result.errors).toBeUndefined();
      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(1);
      expect(mockPrismaService.gPSTrackingLog.create).toHaveBeenCalled();
    });
  });
});