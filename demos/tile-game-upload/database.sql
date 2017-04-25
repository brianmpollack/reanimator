CREATE TABLE `tile_game` (
  `uuid` varchar(36) NOT NULL,
  `updated_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `log` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

ALTER TABLE `tile_game`
  ADD PRIMARY KEY (`uuid`);
