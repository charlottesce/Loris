--
-- Table structure for the electrophysiology component of LORIS
--

-- Create a physiological_modality table
CREATE TABLE `physiological_modality` (
  `PhysiologicalModalityID` INT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
  `PhysiologicalModality`   VARCHAR(50)         NOT NULL UNIQUE,
  PRIMARY KEY (`PhysiologicalModalityID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- Create a physiological_output_type table
CREATE TABLE `physiological_output_type` (
  `PhysiologicalOutputTypeID` INT(5)      UNSIGNED NOT NULL AUTO_INCREMENT,
  `OutputTypeName`            VARCHAR(20)          NOT NULL UNIQUE,
  `OutputTypeDescription`     VARCHAR(255),
  PRIMARY KEY (`PhysiologicalOutputTypeID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- Create a physiological_file table
-- Note that the field InsertedByUser refers to the Linux User that ran the script
-- and not a LORIS user
CREATE TABLE `physiological_file` (
  `PhysiologicalFileID`       INT(10)    UNSIGNED  NOT NULL      AUTO_INCREMENT,
  `PhysiologicalModalityID`   INT(5)     UNSIGNED  DEFAULT NULL,
  `PhysiologicalOutputTypeID` INT(5)     UNSIGNED  NOT NULL,
  `SessionID`                 INT(10)    UNSIGNED  NOT NULL,
  `InsertTime`                TIMESTAMP            NOT NULL      DEFAULT CURRENT_TIMESTAMP,
  `FileType`                  VARCHAR(12)          DEFAULT NULL,
  `AcquisitionTime`           DATETIME             DEFAULT '1970-01-01 00:00:01',
  `InsertedByUser`            VARCHAR(50)          NOT NULL,
  `FilePath`                  VARCHAR(255)         NOT NULL,
  `Index`                     INT(5)               DEFAULT NULL,
  `ParentID`                  INT(10) unsigned     DEFAULT NULL,
  PRIMARY KEY (`PhysiologicalFileID`),
  CONSTRAINT `FK_session_ID`
    FOREIGN KEY (`SessionID`)
    REFERENCES `session` (`ID`),
  CONSTRAINT `FK_ImagingFileTypes_type`
    FOREIGN KEY (`FileType`)
    REFERENCES `ImagingFileTypes` (`type`),
  CONSTRAINT `FK_phys_modality_ModID`
    FOREIGN KEY (`PhysiologicalModalityID`)
    REFERENCES `physiological_modality` (`PhysiologicalModalityID`),
  CONSTRAINT `FK_phys_output_type_TypeID`
    FOREIGN KEY (`PhysiologicalOutputTypeID`)
    REFERENCES `physiological_output_type` (`PhysiologicalOutputTypeID`),
  CONSTRAINT `FK_ParentID`
    FOREIGN KEY (`ParentID`)
    REFERENCES `physiological_file` (`PhysiologicalFileID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- Create a physiological_split_file table
CREATE TABLE `physiological_split_file` (
  `ID`        INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `Index`     INT(5)           NOT NULL,
  `ArchiveID` INT(10) UNSIGNED NOT NULL,
  `FileType`  VARCHAR(12)      DEFAULT NULL,
  `FilePath`  VARCHAR(255)     NOT NULL,
  `Duration`  DECIMAL(10,3)    NOT NULL,
  CONSTRAINT `FK_ArchiveID`
    FOREIGN KEY (`ArchiveID`)
    REFERENCES `physiological_file` (`PhysiologicalFileID`),
  CONSTRAINT `FK_ImagingFileTypes`
    FOREIGN KEY (`FileType`)
    REFERENCES `ImagingFileTypes` (`type`),
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create a physiological_parameter_file table that will store all JSON
-- information that accompanies the BIDS physiological dataset
CREATE TABLE `physiological_parameter_file` (
  `PhysiologicalParameterFileID` INT(10) UNSIGNED NOT NULL  AUTO_INCREMENT,
  `PhysiologicalFileID`          INT(10) UNSIGNED NOT NULL,
  `ParameterTypeID`              INT(10) UNSIGNED NOT NULL,
  `InsertTime`                   TIMESTAMP        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
  `Value`                        TEXT,
  PRIMARY KEY (`PhysiologicalParameterFileID`),
  CONSTRAINT `FK_phys_file_FileID`
    FOREIGN KEY (`PhysiologicalFileID`)
    REFERENCES `physiological_file` (`PhysiologicalFileID`)
    ON DELETE CASCADE,
  CONSTRAINT `FK_param_type_ParamTypeID`
    FOREIGN KEY (`ParameterTypeID`)
    REFERENCES `parameter_type` (`ParameterTypeID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



-- Create a physiological_status_type table
CREATE TABLE `physiological_status_type` (
  `PhysiologicalStatusTypeID` INT(5)      UNSIGNED NOT NULL AUTO_INCREMENT,
  `ChannelStatus`             VARCHAR(10)          NOT NULL UNIQUE,
  PRIMARY KEY (`PhysiologicalStatusTypeID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



-- Create a physiological_channel_type table
CREATE TABLE `physiological_channel_type` (
  `PhysiologicalChannelTypeID` INT(5)       UNSIGNED NOT NULL      AUTO_INCREMENT,
  `ChannelTypeName`            VARCHAR(255)          NOT NULL      UNIQUE,
  `ChannelDescription`         VARCHAR(255)          DEFAULT NULL,
  PRIMARY KEY (`PhysiologicalChannelTypeID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



-- Create a physiological_channel table that will store all information from
CREATE TABLE `physiological_channel` (
  `PhysiologicalChannelID`     INT(10)    UNSIGNED NOT NULL      AUTO_INCREMENT,
  `PhysiologicalFileID`        INT(10)    UNSIGNED NOT NULL,
  `PhysiologicalChannelTypeID` INT(5)     UNSIGNED NOT NULL,
  `PhysiologicalStatusTypeID`  INT(5)     UNSIGNED DEFAULT NULL,
  `InsertTime`                 TIMESTAMP           NOT NULL      DEFAULT CURRENT_TIMESTAMP,
  `Name`                       VARCHAR(50)         NOT NULL,
  `Description`                VARCHAR(255)        DEFAULT NULL,
  `SamplingFrequency`          INT(6)              DEFAULT NULL,
  `LowCutoff`                  DECIMAL(8,3)        DEFAULT NULL,
  `HighCutoff`                 DECIMAL(8,3)        DEFAULT NULL,
  `ManualFlag`                 DECIMAL(5,4)        DEFAULT NULL,
  `Notch`                      INT(6)              DEFAULT NULL,
  `Reference`                  VARCHAR(255)        DEFAULT NULL,
  `StatusDescription`          VARCHAR(255)        DEFAULT NULL,
  `Unit`                       VARCHAR(255)        DEFAULT NULL,
  `FilePath`                   VARCHAR(255)        DEFAULT NULL,
  PRIMARY KEY (`PhysiologicalChannelID`),
  CONSTRAINT `FK_phys_file_FileID_2`
    FOREIGN KEY (`PhysiologicalFileID`)
    REFERENCES `physiological_file` (`PhysiologicalFileID`)
    ON DELETE CASCADE,
  CONSTRAINT `FK_phys_channel_type_TypeID`
    FOREIGN KEY (`PhysiologicalChannelTypeID`)
    REFERENCES `physiological_channel_type` (`PhysiologicalChannelTypeID`),
  CONSTRAINT `FK_phys_status_type_TypeID`
    FOREIGN KEY (`PhysiologicalStatusTypeID`)
    REFERENCES `physiological_status_type` (`PhysiologicalStatusTypeID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- Create physiological_coord_system_type table
CREATE TABLE IF NOT EXISTS `physiological_coord_system_type` (
  `PhysiologicalCoordSystemTypeID`  INT(10)     UNSIGNED  NOT NULL AUTO_INCREMENT,
  `Name`                            VARCHAR(20)           NOT NULL UNIQUE,
  PRIMARY KEY (`PhysiologicalCoordSystemTypeID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create physiological_coord_system_name table
CREATE TABLE IF NOT EXISTS `physiological_coord_system_name` (
  `PhysiologicalCoordSystemNameID`  INT(10)     UNSIGNED  NOT NULL AUTO_INCREMENT,
  `Name`                            VARCHAR(25)           NOT NULL UNIQUE,
  `Orientation`                     VARCHAR(5)            NULL,
  `Origin`                          VARCHAR(50)           NULL,
  PRIMARY KEY (`PhysiologicalCoordSystemNameID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create physiological_coord_system_unit table
CREATE TABLE IF NOT EXISTS `physiological_coord_system_unit` (
  `PhysiologicalCoordSystemUnitID`  INT(10)     UNSIGNED  NOT NULL AUTO_INCREMENT,
  `Name`                            VARCHAR(20)           NOT NULL UNIQUE,
  `Symbol`                          VARCHAR(5)            NULL UNIQUE,
  PRIMARY KEY (`PhysiologicalCoordSystemUnitID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create physiological_coord_system table
CREATE TABLE IF NOT EXISTS `physiological_coord_system` (
  `PhysiologicalCoordSystemID`  INT(10)     UNSIGNED  NOT NULL AUTO_INCREMENT,
  `NameID`                      INT(10)     UNSIGNED  NOT NULL,
  `TypeID`                      INT(10)     UNSIGNED  NOT NULL,
  `UnitID`                      INT(10)     UNSIGNED  NOT NULL,
  `ModalityID`                  INT(5)      UNSIGNED  NOT NULL,
  `FilePath`                    VARCHAR(255)          NULL,
  PRIMARY KEY (`PhysiologicalCoordSystemID`),
  CONSTRAINT `FK_PhysCoordSystemType_type`
    FOREIGN KEY (`TypeID`)
    REFERENCES `physiological_coord_system_type` (`PhysiologicalCoordSystemTypeID`),
  CONSTRAINT `FK_PhysCoordSystemName_name`
    FOREIGN KEY (`NameID`)
    REFERENCES `physiological_coord_system_name` (`PhysiologicalCoordSystemNameID`),
  CONSTRAINT `FK_PhysCoordSystemUnit_unit`
    FOREIGN KEY (`UnitID`)
    REFERENCES `physiological_coord_system_unit` (`PhysiologicalCoordSystemUnitID`),
  CONSTRAINT `FK_PhysCoordSystemModality_modality`
    FOREIGN KEY (`ModalityID`)
    REFERENCES `physiological_modality` (`PhysiologicalModalityID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

-- Create point_3d table
CREATE TABLE IF NOT EXISTS `point_3d` (
  `Point3DID` INT(10) UNSIGNED  NOT NULL AUTO_INCREMENT,
  `X`         DOUBLE            NULL,
  `Y`         DOUBLE            NULL,
  `Z`         DOUBLE            NULL,
  PRIMARY KEY (`Point3DID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

-- Create physiololgical_electrode_type table
CREATE TABLE `physiological_electrode_type` (
  `PhysiologicalElectrodeTypeID` INT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
  `ElectrodeType`                VARCHAR(50)     NOT NULL UNIQUE,
  PRIMARY KEY (`PhysiologicalElectrodeTypeID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create physiological_electrode_material table
CREATE TABLE `physiological_electrode_material` (
  `PhysiologicalElectrodeMaterialID` INT(5) UNSIGNED NOT NULL AUTO_INCREMENT,
  `ElectrodeMaterial`                VARCHAR(50)     NOT NULL UNIQUE,
  PRIMARY KEY (`PhysiologicalElectrodeMaterialID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create a physiological_electrode table
CREATE TABLE `physiological_electrode` (
  `PhysiologicalElectrodeID`          INT(10) UNSIGNED NOT NULL      AUTO_INCREMENT,
  `PhysiologicalElectrodeTypeID`      INT(5)  UNSIGNED DEFAULT NULL,
  `PhysiologicalElectrodeMaterialID`  INT(5)  UNSIGNED DEFAULT NULL,
  `Name`                              VARCHAR(50)      NOT NULL,
  `Point3DID`                         INT(10) UNSIGNED NOT NULL,
  `Impedance`                         INT(10)          DEFAULT NULL,
  `FilePath`                          VARCHAR(255)     DEFAULT NULL,
  PRIMARY KEY (`PhysiologicalElectrodeID`),
  CONSTRAINT `FK_phys_elec_type_ID`
    FOREIGN KEY (`PhysiologicalElectrodeTypeID`)
    REFERENCES `physiological_electrode_type` (`PhysiologicalElectrodeTypeID`),
  CONSTRAINT `FK_phys_elec_material_ID`
    FOREIGN KEY (`PhysiologicalElectrodeMaterialID`)
    REFERENCES `physiological_electrode_material` (`PhysiologicalElectrodeMaterialID`),
  CONSTRAINT `FK_phys_electrode_point_3d`
    FOREIGN KEY (`Point3DID`)
    REFERENCES `point_3d`(`Point3DID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create physiological_coord_system_point_3d_rel table
CREATE TABLE IF NOT EXISTS `physiological_coord_system_point_3d_rel` (
  `PhysiologicalCoordSystemID` INT(10) UNSIGNED NOT NULL,
  `Point3DID`                  INT(10) UNSIGNED NOT NULL,
  `Name`                       VARCHAR(50)      NULL,
  PRIMARY KEY (`PhysiologicalCoordSystemID`, `Point3DID`),
  CONSTRAINT `fk_phys_coord_system_point_3d_rel_coord_system`
    FOREIGN KEY (`PhysiologicalCoordSystemID`)
    REFERENCES `physiological_coord_system` (`PhysiologicalCoordSystemID`),
  CONSTRAINT `fk_phys_coord_system_point_3d_rel_point`
    FOREIGN KEY (`Point3DID`)
    REFERENCES `point_3d` (`Point3DID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

-- Create physiological_coord_system_electrode_rel table
CREATE TABLE IF NOT EXISTS `physiological_coord_system_electrode_rel` (
  `PhysiologicalCoordSystemID`  INT(10)    UNSIGNED   NOT NULL,
  `PhysiologicalElectrodeID`    INT(10)    UNSIGNED   NOT NULL,
  `PhysiologicalFileID`         INT(10)    UNSIGNED   NOT NULL,
  `InsertTime`                  TIMESTAMP             NOT NULL   DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (
    `PhysiologicalCoordSystemID`,
    `PhysiologicalElectrodeID`
  ),
  CONSTRAINT `FK_phys_coord_system_electrode_rel_coord_system`
    FOREIGN KEY (`PhysiologicalCoordSystemID`)
    REFERENCES `physiological_coord_system` (`PhysiologicalCoordSystemID`),
  CONSTRAINT `FK_phys_coord_system_electrode_rel_electrode`
    FOREIGN KEY (`PhysiologicalElectrodeID`)
    REFERENCES `physiological_electrode` (`PhysiologicalElectrodeID`),
  CONSTRAINT `FK_phys_coord_system_electrode_rel_phys_file`
    FOREIGN KEY (`PhysiologicalFileID`)
    REFERENCES `physiological_file` (`PhysiologicalFileID`)
    ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

-- Create `physiological_event_file` table
CREATE TABLE `physiological_event_file` (
    `EventFileID` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `PhysiologicalFileID` int(10) unsigned NOT NULL,
    `FileType` varchar(20) NOT NULL,
    `FilePath` varchar(255) DEFAULT NULL,
    `LastUpdate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `LastWritten` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`EventFileID`),
    KEY `FK_physio_file_ID` (`PhysiologicalFileID`),
    KEY `FK_event_file_type` (`FileType`),
    CONSTRAINT `FK_event_file_type` FOREIGN KEY (`FileType`) REFERENCES `ImagingFileTypes` (`type`),
    CONSTRAINT `FK_physio_file_ID` FOREIGN KEY (`PhysiologicalFileID`) REFERENCES `physiological_file` (`PhysiologicalFileID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8
;

-- Create physiological_task_event table that will store all information
-- regarding the task executed during the physiological recording
CREATE TABLE `physiological_task_event` (
  `PhysiologicalTaskEventID` INT(10) UNSIGNED NOT NULL      AUTO_INCREMENT,
  `PhysiologicalFileID`      INT(10) UNSIGNED NOT NULL,
  `EventFileID`              INT(10) unsigned NOT NULL,
  `InsertTime`               TIMESTAMP        NOT NULL      DEFAULT CURRENT_TIMESTAMP,
  `Onset`                    DECIMAL(11,6)    NOT NULL,
  `Duration`                 DECIMAL(11,6)    NOT NULL,
  `EventCode`                INT(10)          DEFAULT NULL,
  `EventValue`               varchar(255)     DEFAULT NULL,
  `EventSample`              decimal(11,6)    DEFAULT NULL,
  `EventType`                VARCHAR(50)      DEFAULT NULL,
  `TrialType`                VARCHAR(255)     DEFAULT NULL,
  `ResponseTime`             TIME             DEFAULT NULL,
  `AssembledHED`	     TEXT             DEFAULT NULL,
  PRIMARY KEY (`PhysiologicalTaskEventID`),
  KEY `FK_event_file` (`EventFileID`),
  CONSTRAINT `FK_phys_file_FileID_4`
    FOREIGN KEY (`PhysiologicalFileID`)
    REFERENCES `physiological_file` (`PhysiologicalFileID`)
    ON DELETE CASCADE,
  CONSTRAINT `FK_event_file`
    FOREIGN KEY (`EventFileID`)
    REFERENCES `physiological_event_file` (`EventFileID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create `physiological_task_event_opt` table
-- tracks additional events from bids archives
CREATE TABLE `physiological_task_event_opt` (
    `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `PhysiologicalTaskEventID` int(10) unsigned NOT NULL,
    `PropertyName`             varchar(50) NOT NULL,
    `PropertyValue`            varchar(255) NULL,
    PRIMARY KEY (`ID`),
    CONSTRAINT `FK_event_task_opt`
        FOREIGN KEY (`PhysiologicalTaskEventID`)
        REFERENCES `physiological_task_event` (`PhysiologicalTaskEventID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create `physiological_event_archive` to store event archive info
CREATE TABLE `physiological_event_archive` (
    `EventArchiveID` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `PhysiologicalFileID` int(10) unsigned NOT NULL,
    `Blake2bHash` varchar(128) NOT NULL,
    `FilePath` varchar(255) NOT NULL,
    PRIMARY KEY (`EventArchiveID`),
    KEY `FK_phy_file_ID` (`PhysiologicalFileID`),
    CONSTRAINT `FK_phy_file_ID` FOREIGN KEY (`PhysiologicalFileID`) REFERENCES `physiological_file` (`PhysiologicalFileID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8
;

-- Create `physiological_event_parameter` to capture all event parameters
-- from events.json
CREATE TABLE `physiological_event_parameter` (
    `EventParameterID` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `EventFileID` int(10) unsigned NOT NULL,
    `ParameterName` varchar(255) NOT NULL,
    `Description` text DEFAULT NULL,
    `LongName` varchar(255) DEFAULT NULL,
    `Units` varchar(50) DEFAULT NULL,
    `isCategorical` enum('Y', 'N') DEFAULT NULL,
    `HED` text DEFAULT NULL,
    PRIMARY KEY (`EventParameterID`),
    KEY `FK_event_file_ID` (`EventFileID`),
    CONSTRAINT `FK_event_file_ID` FOREIGN KEY (`EventFileID`) REFERENCES `physiological_event_file` (`EventFileID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8
;

-- Create `physiological_event_parameter_category_level` to capture
-- category levels from events.json
CREATE TABLE `physiological_event_parameter_category_level` (
    `CategoricalLevelID` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `EventParameterID` int(10) unsigned NOT NULL,
    `LevelName` varchar(255) NOT NULL,
    `Description` text DEFAULT NULL,
    `HED` text DEFAULT NULL,
    PRIMARY KEY (`CategoricalLevelID`),
    KEY `FK_event_param_ID` (`EventParameterID`),
    CONSTRAINT `FK_event_param_ID` FOREIGN KEY (`EventParameterID`) REFERENCES `physiological_event_parameter` (`EventParameterID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8
;

-- Create physiological_archive which will store archives of all the files for
-- Front-end download
CREATE TABLE `physiological_archive` (
  `PhysiologicalArchiveID`   INT(10) UNSIGNED NOT NULL   AUTO_INCREMENT,
  `PhysiologicalFileID`      INT(10) UNSIGNED NOT NULL,
  `InsertTime`               TIMESTAMP        NOT NULL   DEFAULT CURRENT_TIMESTAMP,
  `Blake2bHash`              VARCHAR(128)     NOT NULL,
  `FilePath`                 VARCHAR(255)     NOT NULL,
  PRIMARY KEY (`PhysiologicalArchiveID`),
  CONSTRAINT `FK_phys_file_FileID_5`
    FOREIGN KEY (`PhysiologicalFileID`)
    REFERENCES `physiological_file` (`PhysiologicalFileID`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- SQL tables for BIDS derivative file structure
-- Create physiological_annotation_file_type table
CREATE TABLE `physiological_annotation_file_type` (
    `FileType`        VARCHAR(20)   NOT NULL UNIQUE,
    `Description`     VARCHAR(255),
    PRIMARY KEY (`FileType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create physiological_annotation_file table
CREATE TABLE `physiological_annotation_file` (
    `AnnotationFileID`    INT(10)      UNSIGNED NOT NULL AUTO_INCREMENT,
    `PhysiologicalFileID` INT(10)      UNSIGNED NOT NULL,
    `FileType`            VARCHAR(20)  NOT NULL,
    `FilePath`            VARCHAR(255),
    `LastUpdate`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `LastWritten`         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`AnnotationFileID`),
    CONSTRAINT `FK_phys_file_ID`
        FOREIGN KEY (`PhysiologicalFileID`)
        REFERENCES `physiological_file` (`PhysiologicalFileID`),
    CONSTRAINT `FK_annotation_file_type`
        FOREIGN KEY (`FileType`)
        REFERENCES `physiological_annotation_file_type` (`FileType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create annotation_archive which will store archives of all the annotation files for
-- Front-end download
CREATE TABLE `physiological_annotation_archive` (
  `AnnotationArchiveID` INT(10) UNSIGNED NOT NULL   AUTO_INCREMENT,
  `PhysiologicalFileID` INT(10) UNSIGNED NOT NULL,
  `Blake2bHash`         VARCHAR(128)     NOT NULL,
  `FilePath`            VARCHAR(255)     NOT NULL,
  PRIMARY KEY (`AnnotationArchiveID`),
  CONSTRAINT `FK_physiological_file_ID`
    FOREIGN KEY (`PhysiologicalFileID`)
    REFERENCES `physiological_file` (`PhysiologicalFileID`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create annotation_parameter table
-- Note: This corresponds with the JSON annotation files
CREATE TABLE `physiological_annotation_parameter` (
    `AnnotationParameterID` INT(10)      UNSIGNED NOT NULL AUTO_INCREMENT,
    `AnnotationFileID`      INT(10)      UNSIGNED NOT NULL,
    `Description`           TEXT         DEFAULT NULL,
    `Sources`               VARCHAR(255),
    `Author`                VARCHAR(255),
    PRIMARY KEY (`AnnotationParameterID`),
    CONSTRAINT `FK_annotation_file_ID`
        FOREIGN KEY (`AnnotationFileID`)
        REFERENCES `physiological_annotation_file` (`AnnotationFileID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create an annotation_label_type table
CREATE TABLE `physiological_annotation_label` (
  `AnnotationLabelID`    INT(5)       UNSIGNED NOT NULL AUTO_INCREMENT,
  `AnnotationFileID`     INT(10)      UNSIGNED DEFAULT NULL,
  `LabelName`            VARCHAR(255) NOT NULL,
  `LabelDescription`     TEXT         DEFAULT NULL,
  PRIMARY KEY (`AnnotationLabelID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create annotation_tsv table
-- Note: This corresponds with the .tsv annotation files
CREATE TABLE `physiological_annotation_instance` (
    `AnnotationInstanceID`  INT(10)         UNSIGNED NOT NULL AUTO_INCREMENT,
    `AnnotationFileID`      INT(10)         UNSIGNED NOT NULL,
    `AnnotationParameterID` INT(10)         UNSIGNED NOT NULL,
    `Onset`                 DECIMAL(10, 4),
    `Duration`              DECIMAL(10, 4)  DEFAULT 0,
    `AnnotationLabelID`     INT(5)          UNSIGNED NOT NULL,
    `Channels`              TEXT,
    `AbsoluteTime`          TIMESTAMP,
    `Description`           VARCHAR(255),
    PRIMARY KEY (`AnnotationInstanceID`),
    CONSTRAINT `FK_annotation_parameter_ID`
        FOREIGN KEY (`AnnotationParameterID`)
        REFERENCES `physiological_annotation_parameter` (`AnnotationParameterID`),
    CONSTRAINT `FK_annotation_file`
        FOREIGN KEY (`AnnotationFileID`)
        REFERENCES `physiological_annotation_file` (`AnnotationFileID`),
    CONSTRAINT `FK_annotation_label_ID`
        FOREIGN KEY (`AnnotationLabelID`)
        REFERENCES `physiological_annotation_label` (`AnnotationLabelID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create physiological_annotation_rel table
CREATE TABLE `physiological_annotation_rel` (
    `AnnotationTSV`  INT(10)    UNSIGNED NOT NULL,
    `AnnotationJSON` INT(10)    UNSIGNED NOT NULL,
    PRIMARY KEY (`AnnotationTSV`, `AnnotationJSON`),
    CONSTRAINT `FK_AnnotationTSV`
        FOREIGN KEY (`AnnotationTSV`)
        REFERENCES `physiological_annotation_file` (`AnnotationFileID`),
    CONSTRAINT `FK_AnnotationJSON`
        FOREIGN KEY (`AnnotationJSON`)
        REFERENCES `physiological_annotation_file` (`AnnotationFileID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Insert into physiological_output_type
INSERT INTO physiological_output_type
  (`OutputTypeName`, `OutputTypeDescription`)
  VALUES
  ('raw',         'raw dataset'),
  ('derivative',  'derivative/processed dataset');

-- Insert into physiological_channel_type
INSERT INTO physiological_channel_type
  (`ChannelTypeName`, `ChannelDescription`)
  VALUES
  ('EEG',              'ElectoEncephaloGram: EEG sensors'                    ),
  ('VEOG',             'Vertical ElectroOculoGram (eyes)'                    ),
  ('HEOG',             'Horizontal ElectOculoGram'                           ),
  ('EOG',              'Generic EOG channel, if HEOG or VEOG information not available'),
  ('ECG',              'ElectroCardioGram (heart)'                           ),
  ('EMG',              'ElectroMyoGram (muscle)'                             ),
  ('TRIG',             'System Triggers'                                     ),
  ('REF',              'Reference electrode'                                 ),
  ('GRD',              'Ground electrode'                                    ),
  ('MISC',             'Miscellaneous'                                       ),
  ('MEGMAG',           'MEG magnetometer'                                    ),
  ('MEGGRADAXIAL',     'MEG axial gradiometer'                               ),
  ('MEGGRADPLANAR',    'MEG planar gradiometer'                              ),
  ('MEGGREFMAG',       'MEG reference magnetometer'                          ),
  ('MEGREFGRADAXIAL',  'MEG reference axial gradiometer'                     ),
  ('MEGREFGRADPLANAR', 'MEG reference planar gradiometer'                    ),
  ('MEGOTHER',         'Any other type of MEG sensor'                        ),
  ('ECOG',             'Electrode channel: electrocortigogram (intracranial)'),
  ('SEEG',             'Electrode channel: stereo-electroencephalogram (intracranial)'),
  ('DBS',              'Electrode channel: deep brain stimulation (intracranial)'),
  ('AUDIO',            'Audio signal'                                        ),
  ('PD',               'Photodiode'                                          ),
  ('EYEGAZE',          'Eye Tracker gaze'                                    ),
  ('PUPIL',            'Eye Tracker pupil diameter'                          ),
  ('SYSCLOCK',         'System time showing elapsed time since trial started'),
  ('ADC',              'Analog to Digital input'                             ),
  ('DAC',              'Digital to Analog input'                             ),
  ('HLU',              'Measure position of head and head coils'             ),
  ('FITERR',           'Fit error signal from each head localization coil'   ),
  ('OTHER',            'Any other type of channel'                           );


-- Insert into physiological_modality
INSERT INTO physiological_modality
  (PhysiologicalModality)
  VALUES
  ('Not registered'),
  ('eeg'),
  ('meg'),
  ('ieeg');

-- insert into physiological_coord_system_type
INSERT INTO physiological_coord_system_type
  (`Name`)
  VALUES
  ('Not registered'),
  ('Fiducials'),
  ('AnatomicalLandmark'),
  ('HeadCoil'),
  ('DigitizedHeadPoints');

-- insert into physiological_coord_system_name
INSERT INTO physiological_coord_system_name
  (`Name`, `Orientation`, `Origin`)
  VALUES
  ('Not registered', NULL, NULL),
  ('ACPC', 'RAS', 'anterior commissure'),
  ('Allen Institute', 'RAS', 'Bregma point'),
  ('Analyze', 'LAS', ''),
  ('BTi/4D', 'ALS', 'between the ears'),
  ('CTF', 'ALS', 'between the ears'),
  ('CTF MRI', 'ALS', 'between the ears'),
  ('CTF gradiometer', 'ALS', 'between the ears'),
  ('CapTrak', 'RAS', 'approximately between the ears'),
  ('Chieti ITAB', 'RAS', 'between the ears'),
  ('DICOM', 'LPS', 'centre of MRI gradient coil'),
  ('EEGLAB', 'ALS', 'between the ears'),
  ('FreeSurfer', 'RAS',	'center of isotropic 1mm 256x256x256 volume'),
  ('MNI', 'RAS', 'anterior commissure'),
  ('NIfTI', 'RAS', ''),
  ('Neuromag/Elekta/Megin', 'RAS', 'between the ears'),
  ('Paxinos-Franklin', 'RSP', 'Bregma point'),
  ('Scanner RAS (scanras)', 'RAS', 'scanner origin'),
  ('Talairach-Tournoux', 'RAS', 'anterior commissure'),
  ('Yokogawa', 'ALS', 'center of device');

-- insert into physiological_coord_system_unit
INSERT INTO physiological_coord_system_unit
  (`Name`, `Symbol`)
  VALUES
  ('Not registered', NULL),
  ('Millimeter', 'mm'),
  ('Centimeter', 'cm'),
  ('Meter', 'm');

-- insert into physiological_coord_system
-- `not registered` coord system
INSERT INTO physiological_coord_system
  (`NameID`, `TypeID`, `UnitID`, `ModalityID`, `FilePath`)
  VALUES
  (
    (SELECT PhysiologicalCoordSystemNameID
      FROM physiological_coord_system_name
      WHERE Name = 'Not registered'),
    (SELECT PhysiologicalCoordSystemTypeID
      FROM physiological_coord_system_type
      WHERE Name = 'Not registered'),
    (SELECT PhysiologicalCoordSystemUnitID
      FROM physiological_coord_system_unit
      WHERE Name = 'Not registered'),
    (SELECT PhysiologicalModalityID
      FROM physiological_modality
      WHERE PhysiologicalModality = 'Not registered'),
    NULL
  );

-- Insert into physiological_status_type
INSERT INTO physiological_status_type
  (ChannelStatus)
  VALUES
  ('good'),
  ('bad');

-- Insert into ImagingFileTypes
INSERT INTO ImagingFileTypes
  (type, description)
  VALUES
  ('set',  'EEGlab file format (EEG)'),
  ('bdf',  'Biosemi file format (EEG)'),
  ('vhdr', 'Brainvision file format (EEG)'),
  ('vsm',  'BrainStorm file format (EEG)'),
  ('edf',  'European data format (EEG)'),
  ('cnt',  'Neuroscan CNT data format (EEG)'),
  ('archive', 'Archive file');

-- Insert into annotation_file_type
INSERT INTO physiological_annotation_file_type
    (FileType, Description)
    VALUES
    ('tsv',  'TSV File Type, contains information about each annotation'),
    ('json', 'JSON File Type, metadata for annotations');

-- Insert into annotation_label_type
INSERT INTO physiological_annotation_label
    (AnnotationLabelID, LabelName, LabelDescription)
    VALUES
    (1,  'artifact',            'artifactual data'),
    (2,  'motion',              'motion related artifact'),
    (3,  'flux_jump',           'artifactual data due to flux jump'),
    (4,  'line_noise',          'artifactual data due to line noise (e.g., 50Hz)'),
    (5,  'muscle',              'artifactual data due to muscle activity'),
    (6,  'epilepsy_interictal', 'period deemed interictal'),
    (7,  'epilepsy_preictal',   'onset of preictal state prior to onset of epilepsy'),
    (8,  'epilepsy_seizure',    'onset of epilepsy'),
    (9,  'epilepsy_postictal',  'postictal seizure period'),
    (10, 'epileptiform',        'unspecified epileptiform activity'),
    (11, 'epileptiform_single', 'a single epileptiform graphoelement (including possible slow wave)'),
    (12, 'epileptiform_run',    'a run of one or more epileptiform graphoelements'),
    (13, 'eye_blink',           'Eye blink'),
    (14, 'eye_movement',        'Smooth Pursuit / Saccadic eye movement'),
    (15, 'eye_fixation',        'Fixation onset'),
    (16, 'sleep_N1',            'sleep stage N1'),
    (17, 'sleep_N2',            'sleep stage N2'),
    (18, 'sleep_N3',            'sleep stage N3'),
    (19, 'sleep_REM',           'REM sleep'),
    (20, 'sleep_wake',          'sleep stage awake'),
    (21, 'sleep_spindle',       'sleep spindle'),
    (22, 'sleep_k-complex',     'sleep K-complex'),
    (23, 'scorelabeled',        'a global label indicating that the EEG has been annotated with SCORE.');

